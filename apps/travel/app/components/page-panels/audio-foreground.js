import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-audio-foreground'],
  fullPath: function() {
    var path = this.get('trip').humanizeText(this.get('params.path'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params')
});
