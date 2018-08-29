import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),

  getLoggedInUserId: function() {
    return localStorage.getItem('user_id');
  },

  refreshUser: function(userId) {
    var self = this;
    return this.get('api')
      .getData('/api/legacy/user/' + userId)
      .then(function(results) {
        var serializer = Ember.getOwner(self).lookup('serializer:api');
        serializer.set('store', self.store);
        serializer.pushPayload(self.store, results);
        return self.store.peekRecord('user', userId);
      });
  },

  beforeModel: function() {
    var self = this;
    var userId = this.getLoggedInUserId();
    if (!userId) {
      return self.transitionTo('login');
    }
    return self.refreshUser(userId)
      .then(function(user) {
        return self.transitionTo('user', user);
      });
  }
});
