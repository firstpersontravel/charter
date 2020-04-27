import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-numberpad', 'page-panel-padded'],

  numberInput: '',

  submitText: function() {
    return this.get('params.submit') || 'Submit';
  }.property('params'),

  actions: {
    press: function() {
      var entry = this.get('numberInput');
      if (!entry || entry === '') { return; }
      this.triggerAction({
        action: 'numberpadSubmitted',
        actionContext: [this.get('params.id'), entry]
      });
      this.set('numberInput', '');
    }
  }
});
