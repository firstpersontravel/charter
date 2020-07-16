import Ember from 'ember';
import $ from 'jquery';

export default Ember.Service.extend({

  environment: Ember.inject.service(),

  apiRequestsInProgress: 0,
  timeout: 60000,

  init: function() {
    this._super();
    this._clientId = Math.floor(Math.random() * 10000000).toString();
  },

  clientId: function() { return this._clientId; }.property(),

  ajax: function(url, method, data, contentType) {
    var self = this;
    this.incrementProperty('apiRequestsInProgress');
    var basePath = this.get('environment.apiHost') || '';
    return new Ember.RSVP.Promise(function(resolve, reject) {
      $.ajax({
        url: basePath + url,
        method: method,
        contentType: contentType,
        data: data,
        dataType: 'json',
        timeout: self.get('timeout'),
        success: (res) => {
          self.decrementProperty('apiRequestsInProgress');
          resolve(res);
        },
        error: (err) => {
          self.decrementProperty('apiRequestsInProgress');
          reject(err);
        }
      });  
    }); 
  },

  getData: function(url, data) {
    return this.ajax(url, 'get', data);
  },

  sendData: function(url, method, data) {
    return this.ajax(url, method, JSON.stringify(data), 'application/json');
  },

  updateLocation: function(participantId, latitude, longitude, accuracy, timestamp) {
    return this.sendData(`/api/participants/${participantId}/device_state`, 'post', {
      location_latitude: latitude,
      location_longitude: longitude,
      location_accuracy: accuracy,
      location_timestamp: timestamp
    });
  },

  acknowledgePage: function(playerId, pageName) {
    this.sendData(`/api/players/${playerId}`, 'put', {
      acknowledgedPageName: pageName,
      acknowledgedPageAt: moment.utc().toISOString()
    });
  },

  postAction: function(tripId, name, params) {
    return this.sendData(
      `/api/trips/${tripId}/actions`, 'post',
      { client_id: this._clientId, name: name, params: params }
    );
  },

  postEvent: function(tripId, playerId, params) {
    return this.sendData(
      `/api/trips/${tripId}/events`, 'post',
      Object.assign({}, {
        client_id: this._clientId,
        player_id: playerId,
      }, params)
    );
  }
});
