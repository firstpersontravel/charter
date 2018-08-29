import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  model: function(params) {
    return {id: params.id};
  },

  serialize: function(model) {
    return {id: model.id};
  },

  setupController: function(controller, context) {
    this._super(controller, context);
    var apiHost = this.get('environment.apiHost');
    try {
      window.webkit.messageHandlers.register_native_api_client.postMessage({
        user_id: context.id,
        api_host: apiHost
      });
    } catch(err) {
      // no messageHandlers, probably not native
    }    
  },

  actions: {
    refresh: function() {
      console.log('refresh ignored');
    },

    refreshScript: function() {
      console.log('refreshScript ignored');
    },
    
    reload: function() {
      location.reload(true);  
    }
  }
});
