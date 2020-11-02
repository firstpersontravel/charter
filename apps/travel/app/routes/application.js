import Ember from 'ember';

export default Ember.Route.extend({
  actions: {
    refresh: function() {
      console.warn('Refresh action ignored by application');
    },

    reload: function() {
      console.warn('Reload action ignored by application');
    }
  }
});
