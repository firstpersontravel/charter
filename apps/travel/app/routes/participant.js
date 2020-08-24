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

  actions: {
    refresh: function() {},    
    reload: function() {
      location.reload(true);  
    }
  }
});
