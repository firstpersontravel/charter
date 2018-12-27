import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-numberpad', 'page-panel-padded'],

  numberInput: '',

  submitText: function() {
    return this.get('params.submit') || 'Submit';
  }.property('params'),

  actions: {
    press: function() {
      var correctRef = this.get('params').correct_ref;
      var cue = this.get('params').cue;
      var entry = this.get('numberInput');
      if (!entry || entry === '') { return; }
      var triggered = false;
      var value = this.get('trip').lookupRef(correctRef);
      if (!value || !cue) { return; }
      if (value.toString() === entry.toString()) {
        this.triggerAction({
          action: 'signalCue',
          actionContext: [cue]
        });
        triggered = true;          
      }
      if (!triggered) {
        swal(this.get('params.unknown') || 'Number not recognized');
      }
      this.set('numberInput', '');
    }
  }
});
