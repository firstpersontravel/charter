import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  model: function(params) {
    return this.refreshTripData(params.trip_id)
      .then(() => this.store.peekRecord('trip', params.trip_id));
  },

  setupController: function(controller, context) {
    this._super(controller, context);
    var experience = this.context.get('experience');
    var envName = this.get('environment.environmentName');
    if (envName !== 'production') {
      document.title = `${envName} - ${experience.get('title')}`;
    } else {
      document.title = experience.get('title');
    }
  },

  serialize: function(model) {
    return {trip_id: model.id};
  },

  refreshTripData: function(tripId) {
    var isScriptAlreadyLoaded = !!this.store.peekAll('script').get('length');
    var shouldRefreshScript = !isScriptAlreadyLoaded;
    var params = {
      script: shouldRefreshScript.toString(),
      playerId: this.paramsFor('player').player_id
    };
    var query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    var refreshUrl = `/api/legacy/trip/${tripId}?${query}`;
    tripId = tripId || this.context.id;
    return this.get('api')
      .getData(refreshUrl)
      .then((data) => {
        // unload all data that could be duplicated
        // this.store.unloadAll('action');
        // this.store.unloadAll('message');
        // reload all data
        var serializer = Ember.getOwner(this).lookup('serializer:api');
        serializer.set('store', this.store);
        serializer.pushPayload(this.store, data);
        this.controllerFor('trip').set('lastRefreshed', moment.utc());
        this.controllerFor('player').updateAudioState();
        this.get('api').set('authToken', data.data.attributes.authToken);
      });
  },

  actions: {
    acknowledgePage: function(pageName) {
    },

    refresh: function() {
      this.refreshTripData(this.context.id);
    },

    reload: function() {
      location.reload(true);      
    }
  }
});
