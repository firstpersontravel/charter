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
    var refreshUrl = (
      `/api/legacy/trip/${tripId}` +
      (shouldRefreshScript ? '?script=true' : '')
    );
    tripId = tripId || self.context.id;
    var self = this;
    return this.get('api')
      .getData(refreshUrl)
      .then(function(data) {
        // unload all data that could be duplicated
        // self.store.unloadAll('action');
        // self.store.unloadAll('message');
        // reload all data
        var serializer = Ember.getOwner(self).lookup('serializer:api');
        serializer.set('store', self.store);
        serializer.pushPayload(self.store, data);
        self.controllerFor('trip').set('lastRefreshed', moment.utc());
      });
  },

  actions: {
    acknowledgePage: function(pageName) {
      console.log('acknowledgePage ignored');
    },

    refresh: function() {
      console.log('refreshing');
      this.refresh();
    },

    reload: function() {
      location.reload(true);      
    }
  }
});
