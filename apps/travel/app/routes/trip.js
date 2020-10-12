import Ember from 'ember';

export default Ember.Route.extend({

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  model: function(params) {
    return this.refreshTripData(params.trip_id, params.player_id)
      .then(() => this.store.peekRecord('trip', params.trip_id));
  },

  setupController: function(controller, context) {
    this._super(controller, context);
    const experience = this.context.get('experience');
    const envName = this.get('environment.environmentName');
    if (envName !== 'production') {
      document.title = `${envName} - ${experience.get('title')}`;
    } else {
      document.title = experience.get('title');
    }
  },

  serialize: function(model) {
    return {trip_id: model.id};
  },

  refreshTripData: function(tripId, playerId) {
    this.tripId = (tripId || this.tripId).toString();
    this.playerId = (playerId || this.playerId).toString();
    const isScriptAlreadyLoaded = !!this.store.peekAll('script').get('length');
    const shouldRefreshScript = !isScriptAlreadyLoaded;
    const params = {
      script: shouldRefreshScript ? 'true' : 'false',
      playerId: this.playerId
    };
    const query = Object.keys(params)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    const refreshUrl = `/api/legacy/trip/${this.tripId}?${query}`;
    return this.get('api')
      .getData(refreshUrl)
      .then((data) => {
        // Identity in Sentry
        if (shouldRefreshScript) {
          const scriptContent = data.data.attributes.script.content;
          const player = data.included.find(item => (
            item.type === 'player' &&
            item.id === Number(playerId)
          ));

          const participantId = player &&
            player.relationships.participant &&
            player.relationships.participant.data.id;
          const roleName = player && player.attributes['role-name'];
          const role = (scriptContent.roles || []).find(r => r.name === roleName);
          const participant = participantId ? data.included.find(item => (
            item.type === 'participant' &&
            item.id === participantId
          )) : null;
          Sentry.configureScope(function(scope) {
            scope.setUser({
              id: Number(playerId),
              username: participant ? participant.attributes.name : null,
              email: participant ? participant.attributes.email : null,
              Org: data.data.attributes.org.title,
              Experience: data.data.attributes.experience.title,
              Trip: data.data.attributes.title,
              Role: role ? role.title : roleName,
              Url: `${window.location.origin}/travel/${tripId}/${playerId}`
            });
          });
        }

        // Reload all data
        const serializer = Ember.getOwner(this).lookup('serializer:api');
        serializer.set('store', this.store);
        serializer.pushPayload(this.store, data);
        this.controllerFor('trip').set('lastRefreshed', moment.utc());
        this.controllerFor('player').updateAudioState();
        this.get('api').set('authToken', data.data.attributes.authToken);
        localStorage.setItem('authToken', data.data.attributes.authToken);
      })
      .catch((err) => {
        if (err.status === 401) {
          // Our token expired!
          localStorage.removeItem('authToken');
          window.location.reload();
          return;
        }
        console.error(err);
        Sentry.captureException(err);
        throw new Error(`Failed to load trip data`);
      });
  },

  actions: {
    acknowledgePage: function(pageName) {
    },

    refresh: function() {
      this.refreshTripData();
    },

    reload: function() {
      location.reload(true);      
    }
  }
});
