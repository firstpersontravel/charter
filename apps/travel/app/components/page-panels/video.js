import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-video'],
  fullPath: function() {
    if (!this.get('params.video')) {
      return null;
    }
    var path = this.get('player').humanizeText(this.get('params.video'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params'),

  willClearRender: function() {
    this._super();
    this.$('video').src = '';
  },
});
