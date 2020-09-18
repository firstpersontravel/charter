import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),

  getLoggedInParticipantId: function() {
    return localStorage.getItem('participant_id');
  },

  refreshParticipant: function(participantId) {
    var self = this;
    return this.get('api')
      .getData('/api/legacy/participant/' + participantId)
      .then(function(results) {
        var serializer = Ember.getOwner(self).lookup('serializer:api');
        serializer.set('store', self.store);
        serializer.pushPayload(self.store, results);
        return self.store.peekRecord('participant', participantId);
      });
  },

  beforeModel: function() {
    var self = this;
    var participantId = this.getLoggedInParticipantId();
    if (!participantId) {
      return self.transitionTo('login');
    }
    return self.refreshParticipant(participantId)
      .then(function(participant) {
        return self.transitionTo('participant', participant);
      });
  }
});
