import Ember from 'ember';

export default Ember.Controller.extend({
  trip: Ember.inject.controller(),

  // Messy solution until store.filter is ready.
  allMessages: function() {
    return this.store.peekAll('message');
  }.property(),

  // Messy solution until store.filter is ready.
  model: function() {
    var trip = this.get('trip.model');
    return this.get('allMessages').filterBy('trip', trip);
  }.property('trip.model', 'allMessages.@each.trip')
});
