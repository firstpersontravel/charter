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
    return this.get('playthrough').humanizeText(this.get('params.text'));
  }.property('params.text', 'playthrough.evalContext'),

  actions: {
    press: function() {
      if (this.get('params').cue) {
        this.triggerAction({
          action: 'cue',
          actionContext: [this.get('params').cue]
        });
      } else {
        console.error('no action for this button.');
      }
    }
  }
});
