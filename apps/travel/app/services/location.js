import Ember from 'ember';

export default Ember.Service.extend({
  watchId: null,
  lastFix: null,
  lastError: null,

  // throttle out updates more frequent than every 10 secs.
  minFixFrequency: 10000,

  isWatching: Ember.computed.bool('watchId'),

  handleFix: function(fix, force) {
    const thisFix = new Date();
    if (this._lastFix && thisFix - this._lastFix < this.minFixFrequency && !force) {
      // ignore fix if more frequent
      return;
    }
    this._lastFix = new Date();
    this.setProperties({lastFix: fix, lastError: null});
  },

  handleError: function(error) {
    this.setProperties({lastFix: null, lastError: error, watchId: null});
  },

  lastErrorTitle: function() {
    const error = this.get('lastError');
    if(!error) { return null; }
    switch(error.code) {
    case 'NO_GEOLOCATION':
      return "Location not supported";
    case error.PERMISSION_DENIED:
      return "Location permission denied";
    case error.POSITION_UNAVAILABLE:
      return "Location unavailable";
    case error.TIMEOUT:
      return "Location request timeout";
    case error.UNKNOWN_ERROR:
      return "Unknown error";
    }
  }.property('lastError'),

  startWatching: function() {
    // If we're already watching, clear and restart. Sometimes in safari the watcher
    // goes away
    if(this.get('watchId')) {
      this.stopWatching();
    }
    const options = {enableHighAccuracy: true, maximumAge: 60 * 1000};
    const watchId = navigator.geolocation.watchPosition(
      this.handleFix.bind(this),
      this.handleError.bind(this),
      options); 
    this.set('watchId', watchId);

    // Start watching again on focus, and every minute
    this._startCallback = () => this.startWatching();
    window.addEventListener('focus', this._startCallback);
    this._interval = setInterval(this._startCallback, 60000);
  },

  stopWatching: function() {
    if(!this.get('watchId')) { return; }
    navigator.geolocation.clearWatch(this.get('watchId'));
    clearInterval(this._interval);
    window.removeEventListener('focus', this._startCallback);
    this._startCallback = null;
    this._interval = null;
    this.set('watchId', null);
  }
});
