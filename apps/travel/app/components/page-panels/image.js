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
    if (!this.get('params.image')) {
      return null;
    }
    var path = this.get('player').humanizeText(this.get('params.image'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params')

});
