import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  model: function(params) {
    return this.refreshTripData(params.trip_id)
      .then(() => {
        const trip = this.store.peekRecord('trip', params.trip_id);
        this.get('api').set('authToken', trip.get('authToken'));
        return trip;
      });
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
      roleName: this.paramsFor('player').role_name
    };
    var query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    var refreshUrl = `/api/legacy/trip/${tripId}?${query}`;
    tripId = tripId || self.context.id;
    return this.get('api')
      .getData(refreshUrl)
      .then((data) => {
        // unload all data that could be duplicated
        // self.store.unloadAll('action');
        // self.store.unloadAll('message');
        // reload all data
        var serializer = Ember.getOwner(this).lookup('serializer:api');
        serializer.set('store', this.store);
        serializer.pushPayload(this.store, data);
        this.controllerFor('trip').set('lastRefreshed', moment.utc());
        this.controllerFor('player').updateAudioState();
      });
  },

  actions: {
    acknowledgePage: function(pageName) {
    },

    refresh: function() {
      this.refresh();
    },

    reload: function() {
      location.reload(true);      
    }
  }
});
