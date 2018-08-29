import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  forceRefreshScript: false,

  model: function(params) {
    var self = this;
    return this.refreshPlaythroughData(params.playthrough_id)
      .then(function() {
        return self.store.peekRecord('playthrough', params.playthrough_id);
      });
  },

  setupController: function(controller, context) {
    this._super(controller, context);
    var script = this.context.get('script');
    var envName = this.get('environment.environmentName');
    if (envName !== 'production') {
      document.title = `${envName} - ${script.get('title')}`;
    } else {
      document.title = script.get('title');
    }
  },

  serialize: function(model) {
    return {playthrough_id: model.id};
  },

  refreshPlaythroughData: function(playthroughId) {
    var isScriptAlreadyLoaded = !!this.store.peekAll('script').get('length');
    var shouldRefreshScript = (
      !isScriptAlreadyLoaded ||
      this.get('forceRefreshScript')
    );
    var refreshUrl = (
      `/api/legacy/playthrough/${playthroughId}` +
      (shouldRefreshScript ? '?script=true' : '')
    );
    this.set('forceRefreshScript', false);
    playthroughId = playthroughId || self.context.id;
    var self = this;
    return this.get('api')
      .getData(refreshUrl)
      .then(function(data) {
        // unload all data that could be duplicated
        self.store.unloadAll('action');
        self.store.unloadAll('message');
        // reload all data
        var serializer = Ember.getOwner(self).lookup('serializer:api');
        serializer.set('store', self.store);
        serializer.pushPayload(self.store, data);
        self.controllerFor('playthrough').set('lastRefreshed', moment.utc());
      });
  },

  actions: {

    acknowledgePage: function(pageName) {
      console.log('acknowledgePage ignored');
    },

    refresh: function() {
      this.refresh();
    },

    refreshScript: function() {
      this.set('forceRefreshScript', true);
      this.refresh();
    },
    
    reload: function() {
      location.reload(true);      
    }
  }
});
