import Ember from 'ember';

import fptCore from 'npm:fptcore';

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
    var user = this.context.get('user');
    if (!user) { return; }
    var oldLatitude = this.get('user.locationLatitude');
    var oldLongitude = this.get('user.locationLongitude');
    var oldAccuracy = this.get('user.locationAccuracy');
    user.setProperties({
      locationLatitude: latitude,
      locationLongitude: longitude,
      locationAccuracy: accuracy,
      locationTimestamp: moment.utc(timestamp)
    });

    // Location update path
    // Native update from tablet
    //   - iOS -> server update_device_state
    //            -> creates enterGeofence events on server
    //               -> calls realtimeEvents.event with enterGeofence on
    //                  other clients [NEEDED]
    //            -> sends 'device_state' realtime event to other clients
    //               -> calls realtimeEvents.deviceState on other clients
    //                  -> sets user.location props locally (no new event)
    //                  -> does not enterGeofence events locally
    //   - iOS -> local nativeLocationUpdate
    //            -> sets user.location props locally (no new event)
    //            -> creates enterGeofence events locally
    // Web update from tablet location or debug bar
    //   - web > `location.handleFix` > `lastFixDidChange` >
    //     `player.updateLocation`
    //     -> server update_device_state
    //          -> creates enterGeofence events on server
    //             -> calls realtimeEvents.event with enterGeofence on
    //                other clients [NEEDED]
    //          -> sends 'device_state' realtime event to other clients
    //             -> calls realtimeEvents.deviceState on other clients
    //                -> sets user.location props locally (no new event)
    //                -> does not enterGeofence events locally
    //     -> create enterGeofence events locally

    // Locally enter geofences
    // Don't send geofence_entered events to the server because they are
    // created by the native location update endpoint and the UserController
    // on the server, and notified out with a client id (so therefore ignored)
    // by this one.
    this.enterGeofences(
      oldLatitude, oldLongitude, oldAccuracy,
      latitude, longitude, accuracy);
  },

  /**
   * Figure out which geofences we just entered and create events
   */
  enterGeofences: function(
      oldLatitude, oldLongitude, oldAccuracy,
      newLatitude, newLongitude, newAccuracy) {
    var trip = this.modelFor('trip');
    var script = trip.get('script');
    var oldGeofences = fptCore.GeofenceCore.geofencesInArea(
      script.get('content'), oldLatitude, oldLongitude, oldAccuracy,
      trip.get('waypointOptions'));
    var oldGeofenceNames = oldGeofences.map(g => g.name);
    var newGeofences = fptCore.GeofenceCore.geofencesInArea(
      script.get('content'), newLatitude, newLongitude, newAccuracy,
      trip.get('waypointOptions'));
    var newGeofenceNames = newGeofences.map(g => g.name);
    newGeofenceNames.forEach(function(geofenceName) {
      if (oldGeofenceNames.indexOf(geofenceName) > -1) {
        return;
      }
      this.controllerFor('trip').applyEvent({
        type: 'geofence_entered',
        role: this.context.get('roleName'),
        geofence: geofenceName
      }, moment.utc());
    }, this);
  },

  makeAction: function(name, params) {
    var trip = this.context.get('trip');

    // Make local action
    trip.createLocalAction(name, params, null);
    Ember.run.next(this.controllerFor('trip'),
      'applyReadyLocalActions');
    
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
      var user = this.context.get('user');
      if (!user) { return; }
      var oldLatitude = user.get('locationLatitude');
      var oldLongitude = user.get('locationLongitude');
      var oldAccuracy = user.get('locationAccuracy');
      user.setProperties({
        locationLatitude: fix.coords.latitude,
        locationLongitude: fix.coords.longitude,
        locationAccuracy: fix.coords.accuracy,
        locationTimestamp: moment.utc(fix.timestamp)
      });
      this.enterGeofences(
        oldLatitude, oldLongitude, oldAccuracy,
        fix.coords.latitude, fix.coords.longitude, fix.coords.accuracy);
      this.get('api')
        .updateLocation(user.id,
          fix.coords.latitude, fix.coords.longitude,
          fix.coords.accuracy, Math.floor(fix.timestamp / 1000))
        .then(function() {
          // success
        }, function(err) {
          console.error('Error updating location.');
        });
    },

    sendMessage: function(asRoleName, toRoleName,
        medium, content) {
      var lastFix = this.get('location.lastFixPrivate');
      this.makeAction('custom_message', {
        from_role_name: asRoleName,
        to_role_name: toRoleName,
        message_medium: medium,
        message_content: content,
        location_latitude: lastFix && lastFix.coords.latitude,
        location_longitude: lastFix && lastFix.coords.longitude,
        location_accuracy: lastFix && lastFix.coords.accuracy
      });
    },

    signalCue: function(cueName) {
      this.makeAction('signal_cue', {cue_name: cueName});
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
    },

    goToAdmin: function() {
      this.transitionTo('player.admin');
    }
  }
});
