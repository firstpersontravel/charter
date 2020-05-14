import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':page-panel-image',
    'imageStyleClass'
  ],

  imageStyleClass: function() {
    if (!this.get('params.style')) { return ''; }
    return 'page-panel-image-' + this.get('params.style');
  }.property('params.style'),

  fullPath: function() {
    var path = this.get('player').humanizeText(this.get('params.path'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params')

});
