import Ember from 'ember';

export default Ember.Controller.extend({
  api: Ember.inject.service(),

  participantIdInput: '',

  actions: {
    signin: function(participantId) {
      if (!participantId) {
        participantId = this.get('participantIdInput');
      }
      if (!participantId || participantId === '') { return; }
      swal('Logging in...');
      this.get('api')
        .getData('/api/legacy/participant/' + participantId)
        .then((results) => {
          console.log('results', results);
          const serializer = Ember.getOwner(this).lookup('serializer:api');
          serializer.set('store', this.store);
          serializer.pushPayload(this.store, results);

          const participantId = results.data.id;
          const participant = this.store.peekRecord('participant', participantId);
          localStorage.setItem('participant_id', participantId);
          swal.close();
          this.transitionToRoute('participant', participant);
        })
        .catch((err) => {
          if (err.status === 404) {
            swal('That participant ID was not found.');
            this.set('participantIdInput', '');
            return;
          }
          console.error('Error logging in', err);
          swal('Error logging in.');
          this.set('participantIdInput', '');
        });
    }
  }
});
