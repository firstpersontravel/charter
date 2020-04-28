import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-numberpad', 'page-panel-padded'],

  textInput: '',

  submitText: function() {
    return this.get('params.submit') || 'Submit';
  }.property('params'),

  actions: {
    press: function() {
      var entry = this.get('textInput');
      if (!entry || entry === '') { return; }
      this.triggerAction({
        action: 'textEntrySubmitted',
        actionContext: [this.get('params.id'), entry]
      });
      this.set('textInput', '');
    }
  }
});
