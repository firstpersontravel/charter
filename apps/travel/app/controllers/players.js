import Ember from 'ember';

export default Ember.Controller.extend({

  trip: Ember.inject.controller(),

  // Messy solution until store.filter is ready.
  allPlayers: function() {
    return this.store.peekAll('player');
  }.property(),

  // Messy solution until store.filter is ready.
  model: function() {
    var trip = this.get('trip.model');
    return this.get('allPlayers').filterBy('trip', trip);
  }.property('trip.model', 'allPlayers.@each.trip'),

  findPlayerByRoleName: function(roleName) {
    var player = this.get('model').findBy('roleName', roleName);
    if (!player) {
      throw new Error('player not found for trip ' +
        this.get('model.id') + ' role ' + roleName);
    }
    return player;
  }
});
