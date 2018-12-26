import Ember from 'ember';

export default Ember.Controller.extend({
  trip: Ember.inject.controller(),
  model: Ember.computed.oneWay('trip.model.script')
});
