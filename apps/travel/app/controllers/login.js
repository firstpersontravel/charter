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
    updateCode: function(env) {
      var host = this.get('environment').hostForEnvironment(env);
      var zipUrl = `${host}/travel/dist/dist.zip`;
      try {
        window.webkit.messageHandlers.update_code.postMessage({
          zip_url: zipUrl
        });
      } catch(err) {
        // no messageHandlers, probably not native
      }   
    },
    signin: function(email) {
      if (!email) {
        email = this.get('emailInput');
      }
      var self = this;
      if (!email || email === '') { return; }
      swal('Logging in...');
      this.get('api')
        .getData('/api/users', {email: email})
        .then(function(results) {
          if (results.data.length === 0) {
            swal('no users for this login.');
            return;
          }
          var userId = results.data.users[0].id;
          return self.get('api').getData('/api/legacy/user/' + userId);
        })
        .then(function(results) {
          var serializer = Ember.getOwner(self).lookup('serializer:api');
          serializer.set('store', self.store);
          serializer.pushPayload(self.store, results);

          var userId = results.data.id;
          var user = self.store.peekRecord('user', userId);
          localStorage.setItem('user_id', userId);
          swal.close();
          self.transitionToRoute('user', user);
        })
        .catch(function(err) {
          console.error(err);
          swal('Error logging in.');
          self.set('emailInput', '');
        });
    }
  }
});
