import Ember from 'ember';

import fptCore from 'fptcore';

export default Ember.Controller.extend({
  time: Ember.inject.service(),
  sync: Ember.inject.service(),
  location: Ember.inject.service(),
  api: Ember.inject.service(),
  
  application: Ember.inject.controller(),
  trip: Ember.inject.controller(),

  addressInput: '',
  isGeocoding: false,

  localTime: function() {
    return this.get('time.currentTime').clone().local().format('h:mm:ssa');
  }.property('time.currentTime'),

  lastRefreshedLocal: function() {
    var lastRefreshed = this.get('trip.lastRefreshed');
    if (!lastRefreshed) { return null; }
    return lastRefreshed.clone().local().format('h:mm:ssa');
  }.property('trip.lastRefreshed'),

  waypointOptions: function() {
    return fptCore.WaypointCore.getAllWaypointOptions(
      this.get('trip.model.script.content'));
  }.property('trip.model'),

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

  actions: {
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
