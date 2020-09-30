import Ember from 'ember';
import RealtimeMixin from '../mixins/controllers/realtime';

// Refresh every minute
const FORCE_REFRESH_SECS = 60;

export default Ember.Controller.extend(RealtimeMixin, {
  channelFormat: '/trip_@id',

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
    this.get('time.currentTime');

    // Set refresh if needed
    var now = moment.utc();
    var secsSinceRefresh = now.diff(this.get('lastRefreshed'), 'seconds');
    if (secsSinceRefresh > FORCE_REFRESH_SECS) {
      if (!this.get('awaitingRefreshAt') || now.isBefore(this.get('awaitingRefreshAt'))) {
        this.set('awaitingRefreshAt', now);
      }
    }

    // Refresh if time has arrived
    if (this.get('awaitingRefreshAt') &&
        now.isAfter(this.get('awaitingRefreshAt')) &&
        this.get('api.apiRequestsInProgress') === 0 &&
        this.get('sync.online') &&
        !this.get('sync.inprogress') &&
        !this.get('sync.hasPending')) {
      this.set('awaitingRefreshAt', null);
      this.send('refresh');
    }
  }.observes('time.currentTime').on('init'),

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
        // console.log('self-originated remote participant state update ignored:',
        //   content);
        return;
      }
      var participant = this.store.peekRecord('participant', content.participant_id);
      if (!participant) {
        return;
      }
      if (participant.get('isEmpty')) {
        return;
      }
      // console.log('participant state updated');
      participant.setProperties({
        locationLatitude: content.location_latitude,
        locationLongitude: content.location_longitude,
        locationAccuracy: content.location_accuracy,
        locationTimestamp: moment.utc(content.location_timestamp)
      });
    },

    refresh: function() {
      this.send('refresh');
    },

    reload: function() {
      this.send('reload');
    }
  }
});
