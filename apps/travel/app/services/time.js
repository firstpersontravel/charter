import Ember from 'ember';

export default Ember.Service.extend({
  currentTime: null,
  isPaused: false,

  init: function() {
    this._super();
    this.start();    
  },

  willDestroy: function() {
    this._super();
    if (this._interval) { clearInterval(this._interval); }
  },

  start: function() {
    if (this._interval) { return; }
    this._interval = setInterval(this._updateTime.bind(this), 1000);
    this._updateTime();
    this.set('isPaused', false);
  },

  pause: function() {
    if (!this._interval) { return; }
    clearInterval(this._interval);
    this._interval = null;
    this.set('isPaused', true);
  },

  _updateTime: function() {
    this.set('currentTime', moment.utc());
  }
});
