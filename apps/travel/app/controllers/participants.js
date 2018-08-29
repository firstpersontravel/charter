import Ember from 'ember';

export default Ember.Controller.extend({

  playthrough: Ember.inject.controller(),

  // Messy solution until store.filter is ready.
  allParticipants: function() {
    return this.store.peekAll('participant');
  }.property(),

  // Messy solution until store.filter is ready.
  model: function() {
    var playthrough = this.get('playthrough.model');
    return this.get('allParticipants').filterBy('playthrough', playthrough);
  }.property('playthrough.model', 'allParticipants.@each.playthrough'),

  findParticipantByRoleName: function(roleName) {
    var participant = this.get('model').findBy('roleName', roleName);
    if (!participant) {
      throw new Error('participant not found for playthrough ' +
        this.get('model.id') + ' role ' + roleName);
    }
    return participant;
  }
});
