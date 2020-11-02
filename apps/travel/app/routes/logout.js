import Ember from 'ember';

export default Ember.Route.extend({
  redirect: function () {
    localStorage.removeItem('participant_id');
    this.transitionTo('/');
  }
});
