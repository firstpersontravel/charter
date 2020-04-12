import Ember from 'ember';
import RealtimeMixin from '../mixins/controllers/realtime';

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

  environmentClassName: function() {
    return 'environment-' + this.get('environment.environmentName');
  }.property('environment.environmentName'),

  scriptClassName: function() {
    return 'script-' + this.get('script.model.name');
  }.property('script.model.name'),

  timeDidChange: function() {
    this.get('time');
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

  realtimeEvents: {
    action: function(content) {
      this.send('refresh');
    },

    event: function(content) {
      this.send('refresh');
    },

    trigger: function(content) {
      this.send('refresh');
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
