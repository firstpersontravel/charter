import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),

  afterModel: function() {
    const participant = this.modelFor('participant');
    console.log('participant', participant, participant);
    if (!participant) {
      throw new Error('User not found.');
    }
    return this.get('api')
      .getData('/api/players', {
        orgId: participant.get('org.id'),
        experienceId: participant.get('experience.id'),
        participantId: participant.id,
        sort: '-id'
      })
      .then((results) => {
        const playerData = results.data.players[0];
        if (!playerData) {
          this.transitionTo('login');
          alert('Participant has no active trips.');
          return;
        }
        console.log('participant.afterModel -> transitionTo');
        this.transitionTo('player.page', playerData.tripId, playerData.id);
      });
  }
});
