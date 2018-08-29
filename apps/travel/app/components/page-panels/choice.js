import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-choice', 'page-panel-padded'],

  choices: Ember.computed.oneWay('params.choices'),

  humanizedText: function() {
    return this.get('playthrough').humanizeText(this.get('params.text'));
  }.property('params.text', 'playthrough.evalContext'),

  items: function() {
    var currentValue = this.get('currentValue');
    return this.get('choices').map(function(choice) {
      var value;
      if (choice.value_ref) {
        value = this.get('playthrough').lookupRef(choice.value_ref);
      } else {
        value = choice.value;
      }
      // Convert value to value ref. If string a straight string.
      var valueRef = 'null';
      if (typeof value === 'string') {
        valueRef = '"' + value.toString() + '"';
      } else if (typeof value === 'boolean') {
        valueRef = value.toString();
      } else if (value === null || value === undefined) {
        valueRef = 'null';
      } else if (typeof value === 'number') {
        valueRef = value.toString();
      } else {
        console.warning('invalid value ' + value);
      }
      return {
        valueRef: valueRef,
        text: this.get('playthrough').humanizeText(choice.text),
        isSelected: value === currentValue
      };
    }, this);
  }.property('choices', 'value', 'playthrough.evalContext'),

  currentValue: function() {
    return this.get('playthrough').lookupRef(this.get('params.value_ref'));
  }.property('params', 'playthrough.evalContext'),

  actions: {
    select: function(valueRef) {
      this.triggerAction({
        action: 'setValue',
        actionContext: [this.get('params.value_ref'), valueRef]
      });
    }
  }
});
