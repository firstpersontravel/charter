import Ember from 'ember';

export default Ember.Controller.extend({
  application: Ember.inject.controller(),
  actions: {
    logout: function() {
      localStorage.clear();
      this.transitionToRoute('login');
    },
    debug: function() {
      this.get('application').set('debug', !this.get('application.debug'));
      this.transitionToRoute('participant.page');
    }
  }
});
