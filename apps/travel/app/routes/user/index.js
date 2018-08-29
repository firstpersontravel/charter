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
      .getData('/api/participants/', {
        userId: user.id,
        sort: '-id',
        count: 1
      })
      .then(function(results) {
        var participantData = results.data.participants[0];
        if (!participantData) {
          self.transitionTo('login');
          alert(`${user.get('email')} has no active trips.`);
          return;
        }
        var participantRoleName = participantData.roleName;
        var playthroughId = participantData.playthroughId;
        self.transitionTo('participant.page', playthroughId, 
          participantRoleName);
      });
  }
});
