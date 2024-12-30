import Ember from 'ember';

import fptCore from 'fptcore';

export default Ember.Controller.extend({
  time: Ember.inject.service(),
  sync: Ember.inject.service(),
  location: Ember.inject.service(),
  api: Ember.inject.service(),
  
  application: Ember.inject.controller(),
  trip: Ember.inject.controller(),
  player: Ember.inject.controller(),

  addressInput: '',
  isGeocoding: false,

  tripUrl: function() {
    const trip = this.get('trip.model');
    const orgName = trip.get('org.name');
    const expName = trip.get('experience.name');
    const tripId = trip.id;
    return `/${orgName}/${expName}/operate/trip/${tripId}`;
  }.property('trip.model'),

  playerUrl: function() {
    const trip = this.get('trip.model');
    const orgName = trip.get('org.name');
    const expName = trip.get('experience.name');
    const roleName = this.get('player.model.roleName');
    const participantId = this.get('player.model.participant.id') || 0;
    return `/${orgName}/${expName}/operate/role/${roleName}/${participantId}`;
  }.property('trip.model', 'player.model'),

  localTime: function() {
    return this.get('time.currentTime').clone().local().format('h:mm:ssa');
  }.property('time.currentTime'),

  isSetLocationDisabled: function() {
    return !this.get('player.model.participant');
  }.property('player.model.participant'),

  lastFixTimestampLocal: function() {
    const lastFix = this.get('location.lastFix');
    if (!lastFix) {
      return 'none';
    }
    return moment.utc(lastFix.timestamp).local().format('h:mm:ssa');
  }.property('location.lastFix'),

  lastRefreshedLocal: function() {
    var lastRefreshed = this.get('trip.lastRefreshed');
    if (!lastRefreshed) { return null; }
    return lastRefreshed.clone().local().format('h:mm:ssa');
  }.property('trip.lastRefreshed'),

  waypointOptions: function() {
    const scriptContent = this.get('trip.model.script.content');
    return (scriptContent.waypoints || [])
      .map(waypoint => waypoint.options.map(opt => ({
        name: opt.name,
        title: waypoint.title,
        location: opt.location
      })))
      .flat();
  }.property('trip.model'),

  setLocationToCoords: function(latitude, longitude) {
    this.get('location').stopWatching();
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
        waypointOption.location.coords[0],
        waypointOption.location.coords[1]);
    }
  }
});
