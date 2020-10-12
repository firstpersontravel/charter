import Ember from 'ember';

export default Ember.Controller.extend({
  api: Ember.inject.service(),

  playerIdInput: '',

  actions: {
    signin: function(playerId) {
      if (!playerId) {
        playerId = this.get('playerIdInput');
      }
      if (!playerId || playerId === '') { return; }
      swal('Logging in...');
      this.get('api')
        .getData('/api/legacy/player/' + playerId)
        .then(data => {
          const tripId = data.data.attributes.trip.id;
          localStorage.setItem('player_id', playerId);
          localStorage.setItem('trip_id', tripId);
          window.location.href = `/travel/${tripId}/${playerId}`;
          swal.close();
        })
        .catch((err) => {
          if (err.status === 404) {
            swal('That participant ID was not found.');
            this.set('playerIdInput', '');
            return;
          }
          Sentry.captureException(err);
          swal('Error logging in.');
          this.set('playerIdInput', '');
        });
    }
  }
});
