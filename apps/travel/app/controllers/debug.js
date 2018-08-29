import Ember from 'ember';

import fptCore from 'npm:fptcore';

export default Ember.Controller.extend({
  time: Ember.inject.service(),
  sync: Ember.inject.service(),
  location: Ember.inject.service(),
  api: Ember.inject.service(),
  
  application: Ember.inject.controller(),
  playthrough: Ember.inject.controller(),

  addressInput: '',
  isGeocoding: false,

  localTime: function() {
    return this.get('time.currentTime').clone().local().format('h:mm:ssa');
  }.property('time.currentTime'),

  lastRefreshedLocal: function() {
    var lastRefreshed = this.get('playthrough.lastRefreshed');
    if (!lastRefreshed) { return null; }
    return lastRefreshed.clone().local().format('h:mm:ssa');
  }.property('playthrough.lastRefreshed'),

  waypointOptions: function() {
    return fptCore.WaypointCore.getAllWaypointOptions(
      this.get('playthrough.model.script.content'));
  }.property('playthrough.model'),

  setLocationToCoords: function(latitude, longitude) {
    if (this.get('location.isWatching')) {
      this.get('location').stopWatching();
    }
    this.get('location').handleFix({
      timestamp: moment.utc().valueOf(),
      coords: {
        latitude: latitude,
        longitude: longitude,
        accuracy: 30
      }
    }, true);
  },

  // Messy solution until store.filter is ready.
  allActions: function() {
    return this.store.peekAll('action');
  }.property(),

  // Messy solution until store.filter is ready.
  playthroughActions: function() {
    var playthrough = this.get('playthrough.model');
    return this.get('allActions').filterBy('playthrough', playthrough);
  }.property('playthrough.model', 'allActions.@each.playthrough'),

  // Messy solution until store.filter is ready.
  unappliedActions: function() {
    return this.get('playthroughActions')
      .filterBy('appliedAt', null)
      .filterBy('failedAt', null)
      .sort(function(a, b) {
        return Ember.compare(
          a.get('scheduledAt').valueOf(),
          b.get('scheduledAt').valueOf());
      });
  }.property('playthroughActions.@each.appliedAt'),

  numLocalUnappliedActions: function() {
    return this.get('unappliedActions').length;
  }.property('time.currentTime', 'unappliedActions.length'),

  nextLocalUnappliedAction: function() {
    var actions = this.get('unappliedActions');
    if (!actions.length) { return null; }
    return actions[0];
  }.property('time.currentTime', 'unappliedActions.length'),

  nextActionScheduledAtLocal: function() {
    var action = this.get('nextLocalUnappliedAction');
    if (!action) { return null; }
    return action.get('scheduledAt').clone().local().format('h:mm:ssa');
  }.property('nextLocalUnappliedAction.scheduledAt'),

  actions: {
    toNextAction: function() {
      var nextAction = this.get('nextLocalUnappliedAction');
      if (!nextAction) { return; }
      if (!this.get('time.isPaused')) { this.get('time').pause(); }
      var scheduledAt = nextAction.get('scheduledAt');
      var nextTime = scheduledAt.clone().add(1, 'seconds');
      this.set('time.currentTime', nextTime);
    },
    adjustTime: function(amount) {
      if (!this.get('time.isPaused')) {
        this.get('time').pause();
      }
      var currentTime = this.get('time.currentTime');
      var newTime = currentTime.clone().add(amount, 'seconds');
      this.set('time.currentTime', newTime);
    },
    resetTime: function() {
      if (this.get('time.isPaused')) {
        this.get('time').start();
      }
    },
    goToWaypoint: function(waypointOptionName) {
      var waypointOptions = this.get('waypointOptions');
      var waypointOption = waypointOptions.findBy('name', waypointOptionName);
      if (!waypointOption) { return; }
      this.setLocationToCoords(
        waypointOption.coords[0],
        waypointOption.coords[1]);
    }
  }
});
