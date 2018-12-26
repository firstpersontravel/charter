import Ember from 'ember';

export default Ember.Controller.extend({

  trip: Ember.inject.controller(),

  // Messy solution until store.filter is ready.
  allParticipants: function() {
    return this.store.peekAll('participant');
  }.property(),

  // Messy solution until store.filter is ready.
  model: function() {
    var trip = this.get('trip.model');
    return this.get('allParticipants').filterBy('trip', trip);
  }.property('trip.model', 'allParticipants.@each.trip'),

  findParticipantByRoleName: function(roleName) {
    var participant = this.get('model').findBy('roleName', roleName);
    if (!participant) {
      throw new Error('participant not found for trip ' +
        this.get('model.id') + ' role ' + roleName);
    }
    return participant;
  }
});
