import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['admin-target'],
  
  click: function() {
    this._handleTap();
  },

  touchStart: function() {
    this._handleTap();
  },


  _handleTap: function() {
    this._starts = this._starts || [];
    this._starts.push(new Date().getTime());
    if (this._starts.length < 2) {
      return;
    }
    this._starts = this._starts.slice(this._starts.length - 2);
    var diff = this._starts[1] - this._starts[0];
    if (diff >= 500) {
      return;
    }
    this._starts = [];
    if (prompt('First Person Travel Administration only') !== 'fpt') {
      return;
    }
    this.sendAction();
  },
});
