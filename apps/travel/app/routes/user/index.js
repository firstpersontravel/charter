import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),

  afterModel: function() {
    var user = this.modelFor('user');
    if (!user) {
      throw new Error('User not found.');
    }
    var self = this;
    return this.get('api')
      .getData('/api/players/', {
        userId: user.id,
        sort: '-id',
        count: 1
      })
      .then(function(results) {
        var playerData = results.data.players[0];
        if (!playerData) {
          self.transitionTo('login');
          alert(`${user.get('email')} has no active trips.`);
          return;
        }
        var playerRoleName = playerData.roleName;
        var tripId = playerData.tripId;
        self.transitionTo('player.page', tripId, 
          playerRoleName);
      });
  }
});
