import Ember from 'ember';

export default Ember.Controller.extend({

  environment: Ember.inject.service(),
  api: Ember.inject.service(),

  buildTimestamp: 'loading',
  emailInput: '',

  init: function() {
    this._super();
    Ember.$.get('/travel/dist/build_timestamp.txt')
      .done((res) => {
        this.set('buildTimestamp', res);
      })
      .fail(() => {
        this.set('buildTimestamp', 'error');
      });
  },

  environmentOptions: function() {
    var curEnv = this.get('environment.environmentName');
    return this.get('environment.environmentOptions')
      .map((opt) => ({ name: opt, isSelected: curEnv === opt }));
  }.property('environment.environmentName'),

  actions: {
    updateEnvironment: function(newEnvironmentName) {
      this.get('environment').updateEnvironment(newEnvironmentName);
    },
    signin: function(email) {
      if (!email) {
        email = this.get('emailInput');
      }
      var self = this;
      if (!email || email === '') { return; }
      swal('Logging in...');
      this.get('api')
        .getData('/api/participants', {email: email})
        .then(function(results) {
          if (results.data.length === 0) {
            swal('no participants for this login.');
            return;
          }
          var participantId = results.data.participants[0].id;
          return self.get('api').getData('/api/legacy/participant/' + participantId);
        })
        .then(function(results) {
          var serializer = Ember.getOwner(self).lookup('serializer:api');
          serializer.set('store', self.store);
          serializer.pushPayload(self.store, results);

          var participantId = results.data.id;
          var participant = self.store.peekRecord('participant', participantId);
          localStorage.setItem('participant_id', participantId);
          swal.close();
          self.transitionToRoute('participant', participant);
        })
        .catch(function(err) {
          console.error(err);
          swal('Error logging in.');
          self.set('emailInput', '');
        });
    }
  }
});
