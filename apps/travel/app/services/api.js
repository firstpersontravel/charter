import Ember from 'ember';

// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout
const fetchWithTimeout = (url, ms, options) => {
  if (typeof AbortController === 'function') {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
  } else {
    return fetch(url, options);
  }
};

function ApiRequestError(status, message) {
  this.name = 'ApiRequestError';
  this.status = status;
  this.message = message;
  this.stack = (new Error()).stack;
}

ApiRequestError.prototype = new Error();

export default Ember.Service.extend({
  environment: Ember.inject.service(),

  authToken: null, // should be filled in once obtained
  apiRequestsInProgress: 0,
  timeout: 60000,
  sendToGroupId: null,

  init: function() {
    this._super();
    this._clientId = Math.floor(Math.random() * 10000000).toString();
  },

  clientId: function() { return this._clientId; }.property(),

  ajax: function(url, method, data) {
    this.incrementProperty('apiRequestsInProgress');
    const authToken = this.get('authToken') || localStorage.getItem('authToken');
    const basePath = this.get('environment.apiHost') || '';
    const baseHeaders = data ? { 'Content-Type': 'application/json' } : {};
    const headers = Object.assign(baseHeaders, authToken ?
      { Authorization: `Bearer ${authToken}` } : {});
    const opts = {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : null
    };
    return fetchWithTimeout(basePath + url, this.get('timeout'), opts)
      .catch(err => {
        throw new ApiRequestError(-1, `Client error fetching ${url}: ${err.message}`)
      })
      .then(resp => {
        if (!resp.ok) {
          if (resp.status === 401) {
            localStorage.removeItem('authToken');
            throw new ApiRequestError(resp.status, `Authentication error fetching ${url}`);
          }
          if (resp.status === 403) {
            throw new ApiRequestError(resp.status, `Forbidden error fetching ${url}`);
          }
          if (resp.status === 500) {
            throw new ApiRequestError(resp.status, `Internal error fetching ${url}`);
          }
          if (resp.status > 500) {
            throw new ApiRequestError(resp.status, `Network error ${resp.status} fetching ${url}`);
          }
          throw new ApiRequestError(resp.status, `${resp.status} error fetching ${url}`);
        }
        return resp.json()
      })
      .finally(() => this.decrementProperty('apiRequestsInProgress'));
  },

  getData: function(url) {
    return this.ajax(url, 'get');
  },

  sendData: function(url, method, data) {
    return this.ajax(url, method, data);
  },

  updateLocation: function(tripId, participantId, latitude, longitude, accuracy, timestamp) {
    return this.sendData(`/api/trips/${tripId}/device_state/${participantId}`, 'post', {
      location_latitude: latitude,
      location_longitude: longitude,
      location_accuracy: accuracy,
      location_timestamp: timestamp
    });
  },

  acknowledgePage: function(playerId, pageName) {
    return this.sendData(`/api/players/${playerId}`, 'put', {
      acknowledgedPageName: pageName,
      acknowledgedPageAt: moment.utc().toISOString()
    });
  },

  postAction: function(tripId, playerId, name, params) {
    const url = this.get('sendToGroupId') ?
      `/api/groups/${this.get('sendToGroupId')}/actions` :
      `/api/trips/${tripId}/actions`;
    return this.sendData(
      url, 'post',
      { client_id: this._clientId, player_id: playerId, name: name, params: params }
    );
  },

  postEvent: function(tripId, playerId, params) {
    const url = this.get('sendToGroupId') ?
      `/api/groups/${this.get('sendToGroupId')}/events` :
      `/api/trips/${tripId}/events`;
    return this.sendData(url, 'post', Object.assign({}, {
        client_id: this._clientId,
        player_id: Number(playerId),
      }, params)
    );
  }
});
