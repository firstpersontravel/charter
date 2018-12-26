import Ember from 'ember';
import RealtimeMixin from '../mixins/controllers/realtime';

import update from 'npm:immutability-helper';
import fptCore from 'npm:fptcore';

export default Ember.Controller.extend(RealtimeMixin, {
  channelFormat: '/@env_trip_@id',

  debug: Ember.computed.oneWay('application.debug'),

  environment: Ember.inject.service(),
  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  api: Ember.inject.service(),

  participants: Ember.inject.controller(),
  participant: Ember.inject.controller(),
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
  playthroughActions: function() {
    var playthrough = this.get('model');
    return this.get('allActions').filterBy('playthrough', playthrough);
  }.property('model', 'allActions.@each.playthrough'),

  getUnappliedLocalActions: function() {
    // var utcNow = this.get('time.currentTime');
    // get actions to apply
    var unappliedLocalActions = this.get('playthroughActions')
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
    var selfParticipant = this.get('participant.model');
    var selfScript = selfParticipant.get('playthrough.script');
    var selfRoleName = selfParticipant.get('roleName');
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
        self.get('participant').updateAudioState();
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

  applyAction: function(name, params, applyAt) {
    console.log('applying action', name, params);
    var playthrough = this.get('model');
    var action = { name: name, params: params };
    var script = playthrough.get('script').toJSON();
    script.content = JSON.parse(script.content);
    var context = playthrough.get('evalContext');
    var result = fptCore.ActionCore.applyAction(script, context, action, 
      applyAt);
    this.applyResult(result);
  },

  applyEvent: function(event, applyAt) {
    console.log('applying event', event);
    var playthrough = this.get('model');
    var script = playthrough.get('script').toJSON();
    script.content = JSON.parse(script.content);
    var context = playthrough.get('evalContext');
    var result = fptCore.ActionCore.applyEvent(script, context, event, 
      applyAt);
    this.applyResult(result);
  },

  applyTrigger: function(triggerName, applyAt) {
    console.log('applying trigger', triggerName);
    var playthrough = this.get('model');
    var script = playthrough.get('script').toJSON();
    script.content = JSON.parse(script.content);
    var trigger = script.content.findBy('name', triggerName);
    var context = playthrough.get('evalContext');
    var result = fptCore.ActionCore.applyTrigger(script, context, context, trigger, null, applyAt);
    this.applyResult(result);
  },

  applyResult: function(result) {
    var playthrough = this.get('model');
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
        playthrough.createLocalAction(
          scheduledAction.name, scheduledAction.params,
          scheduleAt, scheduledAction.triggerName || null);
      }, this);
  },

  updateObj: function(obj, updates) {
    Object.keys(updates).forEach(function(key) {
      // fetch
      var existing = obj.get(key);
      var existingCopy = typeof existing === 'object' ?
        Ember.$.extend(true, {}, existing) : existing;
      // vivify
      fptCore.ActionResultCore.autovivify(existingCopy, updates[key]);
      // set
      var updated = update(existingCopy, updates[key]);
      obj.set(key, updated);
    }, this);
  },

  applyResultOp: function(op, uiCallbacks) {
    var participants = this.get('model.participants');
    switch (op.operation) {

      // Update audio
      case 'updateAudio':
        uiCallbacks.updateAudioState();
        break;

      // Update UI
      case 'updateUi':
        uiCallbacks.transition(op.roleName, op.updates.newState);
        break;

      // Update participant
      case 'updateParticipant':
        var participant = participants.findBy('roleName', op.roleName);
        this.updateObj(participant, op.updates);
        console.log('-> ' + op.roleName, JSON.stringify(op.updates));
        break;

      // Update playthrough
      case 'updatePlaythrough':
        this.updateObj(this.get('model'), op.updates);
        console.log('-> playthrough', JSON.stringify(op.updates));
        break;

      // Create a message
      case 'createMessage':
        op.updates.playthrough = this.get('model');
        op.updates.sentBy = participants.findBy('id',
          op.updates.sentById.toString());
        op.updates.sentTo = participants.findBy('id',
          op.updates.sentToId.toString());
        delete op.updates.sentById;
        delete op.updates.sentToId;
        var msg = this.store.createRecord('message', op.updates);
        uiCallbacks.notifyMessage(msg);
        console.log('-> msg', op.updates.messageName ||
          op.updates.messageContent);
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
      var participant = this.get('participant.model');
      var currentPageName = participant.get('currentPageName');
      this.get('api').acknowledgePage(participant.id, currentPageName);
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
