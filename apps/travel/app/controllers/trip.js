import Ember from 'ember';
import RealtimeMixin from '../mixins/controllers/realtime';

import fptCore from 'npm:fptcore';

export default Ember.Controller.extend(RealtimeMixin, {
  channelFormat: '/@env_trip_@id',

  debug: Ember.computed.oneWay('application.debug'),

  environment: Ember.inject.service(),
  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  api: Ember.inject.service(),

  players: Ember.inject.controller(),
  player: Ember.inject.controller(),
  script: Ember.inject.controller(),
  application: Ember.inject.controller(),
  messages: Ember.inject.controller(),

  awaitingRefreshAt: false,
  lastRefreshed: null,

  init: function() {
    this._super();
    Ember.run.next(this, 'applyReadyLocalActions');
  },

  environmentClassName: function() {
    return 'environment-' + this.get('environment.environmentName');
  }.property('environment.environmentName'),

  scriptClassName: function() {
    return 'script-' + this.get('script.model.name');
  }.property('script.model.name'),

  headerTitle: function() {
    return {
      staging: 'Staging',
      development: 'Development'
    }[this.get('environment.environmentName')] || '';
  }.property('environment.environmentName'),

  // Messy solution until store.filter is ready.
  allActions: function() {
    return this.store.peekAll('action');
  }.property(),

  // Messy solution until store.filter is ready.
  tripActions: function() {
    var trip = this.get('model');
    return this.get('allActions').filterBy('trip', trip);
  }.property('model', 'allActions.@each.trip'),

  getUnappliedLocalActions: function() {
    // var utcNow = this.get('time.currentTime');
    // get actions to apply
    var unappliedLocalActions = this.get('tripActions')
      .filter(function(action) {
        return action.get('appliedAt') === null &&
          action.get('failedAt') === null;
      })
      .sort(function(a, b) {
        return Ember.compare(
          a.get('scheduledAt').valueOf(),
          b.get('scheduledAt').valueOf());
      });
    return unappliedLocalActions;
  },

  getLocalActionsReadyToApply: function() {
    var unappliedLocalActions = this.getUnappliedLocalActions();
    var utcNow = this.get('time.currentTime').clone().add(1, 'seconds');
    // get actions to apply
    var actionsToApply = unappliedLocalActions.filter(function(action) {
      return (action.get('scheduledAt').isBefore(utcNow));
    });
    return actionsToApply;
  }, 

  getUiCallbacks: function() {
    var self = this;
    var selfPlayer = this.get('player.model');
    var selfScript = selfPlayer.get('trip.script');
    var selfRoleName = selfPlayer.get('roleName');
    return {
      transition: function(roleName, newState) {
        if (selfRoleName !== roleName) { return; }
        self.transitionToRoute({queryParams: {state: newState}});
      },
      notifyMessage: function(msg) {
        // Notify message if it's to me, not already read, and in past.
        // And if we're the gamble, which is SUUUUUPER HACKY.
        if ((selfRoleName === msg.get('sentTo.roleName')) &&
            !msg.get('readAt') &&
            selfScript.get('name') === 'theheadlandsgamble') {
          self.get('messages').notifyMessage(msg);
        }
      },
      updateAudioState: function() {
        self.get('player').updateAudioState();
      }
    };
  },

  applyReadyLocalActions: function() {
    // Apply actions
    var actionsToApply = this.getLocalActionsReadyToApply();
    if (actionsToApply.get('length') === 0) {
      return;
    }
    actionsToApply.forEach(function(action, i) {
      console.log('==> applying ready local action: ' + action.get('name'));
      this.applyAction(
        action.get('name'),
        action.get('params'),
        action.get('scheduledAt'));
      action.set('appliedAt', moment.utc());
    }, this);

    // If we're online, and have no pending actions to sync to the server,
    // then refresh data from the server, to keep tablet more in-sync.
    this.set('awaitingRefreshAt', moment.utc().add(2, 'seconds'));

    // try not doing this
    // call again to handle any new actions created.
    Ember.run.next(this, 'applyReadyLocalActions');
  },

  timeDidChange: function() {
    this.get('time');
    this.applyReadyLocalActions();
    if (this.get('awaitingRefreshAt') &&
        moment.utc().isAfter(this.get('awaitingRefreshAt')) &&
        this.get('api.apiRequestsInProgress') === 0 &&
        this.get('sync.online') &&
        !this.get('sync.inprogress') &&
        !this.get('sync.hasPending')) {
      this.set('awaitingRefreshAt', null);
      this.send('refresh');
    }
  }.observes('time.currentTime'),

  /**
   * If we come from offline to online, auto-refresh to server
   */
  syncOnlineDidChange: function() {
    if (!this.get('sync.online') ||
      !this.get('lastRefreshed') ||
      this.get('awaitingRefreshAt')) {
      return;
    }
    var now = moment.utc();
    var secsSinceRefresh = now.diff(this.get('lastRefreshed'), 'seconds');
    if (secsSinceRefresh > 15) {
      this.get('awaitingRefreshAt', moment.utc());
    }
  }.observes('sync.online'),

  prepareActionContext: function(applyAt) {
    var trip = this.get('model');
    return {
      scriptContent: trip.get('script.content'),
      evalContext: trip.get('evalContext'),
      timezone: trip.experience.timezone,
      evaluateAt: applyAt
    };
  },

  applyAction: function(name, params, applyAt) {
    console.log('applying action', name, params);
    var action = { name: name, params: params };
    var actionContext = this.prepareActionContext(applyAt);
    var result = fptCore.ActionCore.applyAction(action, actionContext);
    this.applyResult(result);
  },

  applyEvent: function(event, applyAt) {
    console.log('applying event', event);
    var actionContext = this.prepareActionContext(applyAt);
    var result = fptCore.ActionCore.applyEvent(event, actionContext);
    this.applyResult(result);
  },

  applyTrigger: function(triggerName, applyAt) {
    console.log('applying trigger', triggerName);
    var trigger = this.get('model.script.content').findBy('name', triggerName);
    var actionContext = this.prepareActionContext(applyAt);
    var result = fptCore.ActionCore.applyTrigger(trigger, null, actionContext,
      actionContext);
    this.applyResult(result);
  },

  applyResult: function(result) {
    var trip = this.get('model');
    var uiCallbacks = this.getUiCallbacks();

    // Apply results
    result.resultOps.forEach(function(op) {
      this.applyResultOp(op, uiCallbacks);
    }, this);

    // Schedule future actions
    result.scheduledActions
      .forEach(function(scheduledAction) {
        var scheduleAt = moment.utc(scheduledAction.scheduleAt);
        console.log('-> scheduling ' + scheduledAction.name,
          scheduledAction.params, ' at ', scheduleAt.toString());
        trip.createLocalAction(
          scheduledAction.name, scheduledAction.params,
          scheduleAt, scheduledAction.triggerName || null);
      }, this);
  },

  applyResultOp: function(op, uiCallbacks) {
    var players = this.get('model.players');
    switch (op.operation) {

      // Update audio
      case 'updateAudio':
        uiCallbacks.updateAudioState();
        break;

      // Update UI
      case 'updateUi':
        uiCallbacks.transition(op.roleName, op.updates.newState);
        break;

      // Update player
      case 'updatePlayerFields':
        var player = players.findBy('roleName', op.roleName);
        Object.keys(op.fields).forEach(key => {
          player.set(key, op.fields[key]);
        });
        console.log('-> ' + op.roleName, JSON.stringify(op.fields));
        break;

      // Update trip
      case 'updateTripFields':
        Object.keys(op.fields).forEach(key => {
          this.get('model').set(key, op.fields[key]);
        });
        console.log('-> trip', JSON.stringify(op.fields));
        break;

      case 'updateTripValues':
        var newValues = Object.assign({}, this.get('model.values'), op.values);
        this.get('model').set('values', newValues);
        console.log('-> trip values', JSON.stringify(op.values));
        break;

      case 'updateTripHistory':
        var newHistory = Object.assign({}, this.get('model.history'), op.history);
        this.get('model').set('history', newHistory);
        console.log('-> trip values', JSON.stringify(op.history));
        break;

      // Create a message
      case 'createMessage':
        op.fields.trip = this.get('model');
        op.fields.sentBy = players.findBy('id',
          op.fields.sentById.toString());
        op.fields.sentTo = players.findBy('id',
          op.fields.sentToId.toString());
        delete op.fields.sentById;
        delete op.fields.sentToId;
        var msg = this.store.createRecord('message', op.fields);
        uiCallbacks.notifyMessage(msg);
        console.log('-> msg', op.fields.messageName ||
          op.fields.messageContent);
        break;
    }
  },

  realtimeEvents: {
    action: function(content) {
      if (content.client_id === this.get('api').get('clientId')) {
        console.log('self-originated remote action ignored:',
          content.action.attributes.name);
        return;
      }
      var triggerName = content.action.attributes['trigger-name'];
      if (triggerName) {
        var script = this.get('script');
        var trigger = script.findResourceByName('trigger', triggerName);
        if (trigger && !trigger.repeatable) {
          if (this.get('history')[triggerName]) {
            console.log('remote action skipped, trigger ' + triggerName + ' already executed');
            return;
          }
        }
      }
      console.log('remote action triggered:',
        content.action.attributes.name, content.action.attributes.params);

      // Create action object locally
      var serializer = Ember.getOwner(this).lookup('serializer:api');
      serializer.set('store', this.store);
      serializer.pushPayload(this.store, {data: content.action});

      // Apply it if it has already been applied on the server.
      this.applyReadyLocalActions();
    },

    event: function(content) {
      if (content.client_id === this.get('api').get('clientId')) {
        console.log('self-originated remote event ignored:',
          content.event.type);
        return;
      }
      var event = content.event;
      console.log('received event', event);
      this.applyEvent(event, moment.utc(content.sent_at));
    },

    trigger: function(content) {
      var triggerName = content.trigger_name;
      console.log('received trigger', triggerName);
      this.applyTrigger(triggerName, moment.utc(content.sent_at));
    },

    requestAck: function(content) {
      var player = this.get('player.model');
      var currentPageName = player.get('currentPageName');
      this.get('api').acknowledgePage(player.id, currentPageName);
    },

    deviceState: function(content) {
      if (content.client_id === this.get('api').get('clientId')) {
        // console.log('self-originated remote user state update ignored:',
        //   content);
        return;
      }
      var user = this.store.peekRecord('user', content.user_id);
      if (!user) {
        return;
      }
      // console.log('user state updated');
      user.setProperties({
        locationLatitude: content.device_state.location_latitude,
        locationLongitude: content.device_state.location_longitude,
        locationAccuracy: content.device_state.location_accuracy,
        locationTimestamp: moment.utc(content.device_state.location_timestamp)
      });
    },

    updateCode: function() {
      var host = this.get('environment.host');
      var zipUrl = `${host}/travel/dist/dist.zip`;
      try {
        window.webkit.messageHandlers.update_code.postMessage({
          zip_url: zipUrl
        });
      } catch(err) {
        // no messageHandlers, probably not native
      }
    },

    refresh: function() {
      this.send('refresh');
    },

    refreshScript: function() {
      this.send('refreshScript');
    },

    reload: function() {
      this.send('reload');
    }
  }
});
