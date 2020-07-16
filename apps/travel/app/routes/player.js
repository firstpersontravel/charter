import Ember from 'ember';

export default Ember.Route.extend({
  api: Ember.inject.service(),
  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  location: Ember.inject.service(),

  model: function(params) {
    var trip = this.modelFor('trip');
    var players = trip.get('players');
    return players.findBy('roleName', params.role_name);
  },

  setupController: function(controller, context) {
    this._super(controller, context);
    window.nativeLocationUpdate = this.nativeLocationUpdate.bind(this);
  },

  serialize: function(model) {
    return {role_name: model.get('roleName')};
  },

  nativeLocationUpdate: function(latitude, longitude, accuracy, timestamp) {
    if (!this.context) { return; }
    this.get('location').set('lastFixPrivate', {
      coords: {
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy
      },
      timestamp: timestamp
    });
    var participant = this.context.get('participant');
    if (!participant) { return; }
    var oldLatitude = this.get('participant.locationLatitude');
    var oldLongitude = this.get('participant.locationLongitude');
    var oldAccuracy = this.get('participant.locationAccuracy');
    participant.setProperties({
      locationLatitude: latitude,
      locationLongitude: longitude,
      locationAccuracy: accuracy,
      locationTimestamp: moment.utc(timestamp)
    });
  },

  makeEvent: function(params) {
    var trip = this.context.get('trip');
    var playerId = this.context.id;
    
    var api = this.get('api');
    this.get('sync').add(function() {
      return api.postEvent(trip.id, playerId, params)
        .catch(function(err) {
          if (err.readyState !== 4) {
            // network error -- re-raise exception because it might
            // work the second time.
            console.warn('Network error for event ' + params.type);
            throw err;
          } else if (err.status === 502) {
            // gateway error -- nginx can't reach node. worth retrying
            console.warn('Gateway error for event ' + params.type);
            throw err;
          } else {
            // status code error -- like a bad response from the server
            // etc. This will likely not be resolved by retrying, so there
            // isn't much we can do. skip it.
            console.error(`Server error for event ${params.type}: ${err.status}.`);
            swal({
              title: 'Error',
              text: 'We\'re sorry, there was an error. Press OK to refresh.',
            }, function() {
              window.location.reload();
            });
          }
        });
    });
  },

  makeAction: function(name, params) {
    var trip = this.context.get('trip');
    
    var api = this.get('api');
    this.get('sync').add(function() {
      return api.postAction(trip.id, name, params)
        .catch(function(err) {
          if (err.readyState !== 4) {
            // network error -- re-raise exception because it might
            // work the second time.
            console.warn('Network error for action ' + name);
            throw err;
          } else if (err.status === 502) {
            // gateway error -- nginx can't reach node. worth retrying
            console.warn('Gateway error for action ' + name);
            throw err;
          } else {
            // status code error -- like a bad response from the server
            // etc. This will likely not be resolved by retrying, so there
            // isn't much we can do. skip it.
            console.error(`Server error for action ${name}: ${err.status}.`);
            swal({
              title: 'Error',
              text: 'We\'re sorry, there was an error. Press OK to refresh.',
            }, function() {
              window.location.reload();
            });
          }
        });
    });
  },

  actions: {

    acknowledgePage: function(pageName) {
      this.get('api').acknowledgePage(this.context.id, pageName);
    },

    updateLocation: function(fix) {
      var participant = this.context.get('participant');
      if (!participant) { return; }
      var oldLatitude = participant.get('locationLatitude');
      var oldLongitude = participant.get('locationLongitude');
      var oldAccuracy = participant.get('locationAccuracy');
      participant.setProperties({
        locationLatitude: fix.coords.latitude,
        locationLongitude: fix.coords.longitude,
        locationAccuracy: fix.coords.accuracy,
        locationTimestamp: moment.utc(fix.timestamp)
      });
      this.get('api')
        .updateLocation(participant.id,
          fix.coords.latitude, fix.coords.longitude,
          fix.coords.accuracy, Math.floor(fix.timestamp / 1000))
        .then(function() {
          // success
        }, function(err) {
          console.error('Error updating location.');
        });
    },

    sendText: function(asRoleName, toRoleName, content) {
      this.makeAction('send_text', {
        from_role_name: asRoleName,
        to_role_name: toRoleName,
        content: content,
        reply_needed: true
      });
    },

    sendImage: function(asRoleName, toRoleName, url) {
      this.makeAction('send_image', {
        from_role_name: asRoleName,
        to_role_name: toRoleName,
        image: url,
        reply_needed: true
      });
    },

    directionsArrived: function(directionsId) {
      this.makeEvent({
        type: 'directions_arrived',
        directions_id: directionsId
      });
    },

    numberpadSubmitted: function(numberpadId, entry) {
      this.makeEvent({
        type: 'numberpad_submitted',
        role_name: this.context.get('roleName'),
        numberpad_id: numberpadId,
        submission: entry
      });
    },

    textEntrySubmitted: function(textentryId, entry) {
      this.makeEvent({
        type: 'text_entry_submitted',
        role_name: this.context.get('roleName'),
        text_entry_id: textentryId,
        submission: entry
      });
    },

    buttonPressed: function(buttonId) {
      this.makeEvent({
        type: 'button_pressed',
        role_name: this.context.get('roleName'),
        button_id: buttonId
      });
    },

    setValue: function(valueRef, newValueRef) {
      this.makeAction('set_value', {
        value_ref: valueRef,
        new_value_ref: newValueRef
      });
    },

    restartAudio: function() {
      var player = this.context;
      if (!player.get('values.audio.name')) {
        return;
      }
      this.makeAction('play_audio', {
        role_name: player.get('roleName'),
        audio_name: player.get('values.audio.name')
      });
    }
  }
});
