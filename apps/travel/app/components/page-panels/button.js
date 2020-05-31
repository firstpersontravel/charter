import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':page-panel-button',
    ':page-panel-padded',
    'buttonStyleClass'
  ],

  buttonStyleClass: function() {
    if (!this.get('params.style')) { return ''; }
    return 'page-panel-button-' + this.get('params.style');
  }.property('params.style'),

  humanizedText: function() {
    return this.get('player').humanizeText(this.get('params.text'));
  }.property('params.text', 'player.evalContext'),

  actions: {
    press: function() {
      this.triggerAction({
        action: 'buttonPressed',
        actionContext: [this.get('params').id]
      });
    }
  }
});
