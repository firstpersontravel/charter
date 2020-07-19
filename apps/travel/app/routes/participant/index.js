import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),

  afterModel: function() {
    var participant = this.modelFor('participant');
    if (!participant) {
      throw new Error('User not found.');
    }
    var self = this;
    return this.get('api')
      .getData('/api/players/', {
        participantId: participant.id,
        sort: '-id',
        count: 1
      })
      .then(function(results) {
        var playerData = results.data.players[0];
        if (!playerData) {
          self.transitionTo('login');
          alert(`${participant.get('email')} has no active trips.`);
          return;
        }
        var playerRoleName = playerData.roleName;
        var tripId = playerData.tripId;
        self.transitionTo('player.page', tripId, 
          playerRoleName);
      });
  }
});
