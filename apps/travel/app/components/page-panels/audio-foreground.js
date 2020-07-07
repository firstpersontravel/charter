import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-audio-foreground'],
  fullPath: function() {
    if (!this.get('params.path')) {
      return null;
    }
    var path = this.get('player').humanizeText(this.get('params.path'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params')
});
