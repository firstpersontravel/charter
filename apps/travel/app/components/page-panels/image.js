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

  fullPath: Ember.computed.oneWay('params.image')
});
