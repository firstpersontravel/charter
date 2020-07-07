import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-audio-foreground'],
  fullPath: function() {
    if (!this.get('params.audio')) {
      return null;
    }
    var path = this.get('player').humanizeText(this.get('params.audio'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params')
});
