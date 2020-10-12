import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel: function() {
    const playerId = localStorage.getItem('player_id');
    const tripId = localStorage.getItem('trip_id');
    if (!playerId || !tripId) {
      return this.transitionTo('login');
    }
    window.location.href = `/travel/${tripId}/${playerId}`;
  }
});
