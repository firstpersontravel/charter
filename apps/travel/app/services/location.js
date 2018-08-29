import Ember from 'ember';

export default Ember.Service.extend({

  watchId: null,
  lastFix: null,
  lastError: null,

  lastFixPrivate: null,

  // throttle out updates more frequent than every 10 secs.
  minFixFrequency: 10000,

  isWatching: Ember.computed.bool('watchId'),

  handleFix: function(fix, force) {
    var thisFix = new Date();
    if (this._lastFix && thisFix - this._lastFix < this.minFixFrequency &&
      !force) {
      // ignore fix if more frequent
      return;
    }
    this._lastFix = new Date();
    this.setProperties({lastFix: fix, lastFixPrivate: fix, lastError: null});
  },

  handleError: function(error) {
    this.setProperties({lastFix: null, lastFixPrivate: null, lastError: error});
  },

  lastErrorTitle: function() {
    var error = this.get('lastError');
    if(!error) { return null; }
    switch(error.code) {
    case 'NO_GEOLOCATION':
      return "This device does not support geolocation.";
    case error.PERMISSION_DENIED:
      return "User denied the request for geolocation.";
    case error.POSITION_UNAVAILABLE:
      return "Location information is unavailable.";
    case error.TIMEOUT:
      return "The request to get user location timed out.";
    case error.UNKNOWN_ERROR:
      return "An unknown error occurred.";
    }
  }.property('lastError'),

  startWatching: function() {
    if(this.get('watchId')) { return; }
    var options = {enableHighAccuracy: true, maximumAge: 60 * 1000};
    var watchId = navigator.geolocation.watchPosition(
      this.handleFix.bind(this),
      this.handleError.bind(this),
      options); 
    this.set('watchId', watchId);
  },

  stopWatching: function() {
    if(!this.get('watchId')) { return; }
    navigator.geolocation.clearWatch(this.get('watchId'));
    this.set('watchId', null);
  }
});
