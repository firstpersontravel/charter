import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':page-panel-text',
    ':page-panel-padded',
    'textStyleClass'
  ],

  textStyleClass: function() {
    if (!this.get('params.style')) { return ''; }
    return 'page-panel-text-' + this.get('params.style');
  }.property('params.style'),

  humanizedText: function() {
    return this.get('player').humanizeText(this.get('params.text'));
  }.property('params.text', 'trip.evalContext')
});
