import Ember from 'ember';

export default Ember.Controller.extend({
  playthrough: Ember.inject.controller(),
  model: Ember.computed.oneWay('playthrough.model.script')
});
