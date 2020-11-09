import Ember from 'ember';

export default Ember.Route.extend({
  api: Ember.inject.service(),
  sync: Ember.inject.service(),
  time: Ember.inject.service(),
  location: Ember.inject.service(),

  model: function(params) {
    var trip = this.modelFor('trip');
    var players = trip.get('players');
    return players.findBy('id', this.paramsFor('trip').player_id);
  },

  serialize: function(model) {
    return {role_name: model.get('roleName')};
  },

  makeEvent: function(params) {
    var trip = this.context.get('trip');
    var playerId = this.context.id;
    var api = this.get('api');
    this.get('sync').add(() => api.postEvent(trip.id, playerId, params));
  },

  makeAction: function(name, params) {
    var trip = this.context.get('trip');
    var playerId = this.context.id;    
    var api = this.get('api');
    this.get('sync').add(() => api.postAction(trip.id, playerId, name, params));
  },

  actions: {
    acknowledgePage: function(pageName) {
      this.get('api')
        .acknowledgePage(this.context.id, pageName)
        .catch(err => {
          console.error('Error acknowledging page', err);
          // Don't log client errors
          if (err.status === -1) { return; }
          // Send all other errors to sentry
          Sentry.withScope(function(scope) {
            scope.setLevel('warning');
            Sentry.captureException(err);
          });
        });
    },

    updateLocation: function(fix) {
      var trip = this.context.get('trip');
      var participant = this.context.get('participant');
      if (!participant) { return; }
      if (participant.get('isEmpty')) { return; }
      participant.setProperties({
        locationLatitude: fix.coords.latitude,
        locationLongitude: fix.coords.longitude,
        locationAccuracy: fix.coords.accuracy,
        locationTimestamp: moment.utc(fix.timestamp)
      });
      this.get('api')
        .updateLocation(trip.id, participant.id,
          fix.coords.latitude, fix.coords.longitude,
          fix.coords.accuracy, Math.floor(fix.timestamp / 1000))
        .catch(err => {
          console.error('Error updating location', err);
          // Don't log client errors
          if (err.status === -1) { return; }
          // Send all other errors to sentry
          Sentry.withScope(function(scope) {
            scope.setLevel('warning');
            Sentry.captureException(err);
          });
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
        numberpad_id: numberpadId,
        submission: entry
      });
    },

    textEntrySubmitted: function(textentryId, entry) {
      this.makeEvent({
        type: 'text_entry_submitted',
        text_entry_id: textentryId,
        submission: entry
      });
    },

    buttonPressed: function(buttonId) {
      this.makeEvent({ type: 'button_pressed', button_id: buttonId });
    },

    setValue: function(valueRef, newValueRef) {
      this.makeAction('set_value', {
        value_ref: valueRef,
        new_value_ref: newValueRef
      });
    },

    restartAudio: function() {
      const player = this.context;
      const roleName = player.get('roleName');
      const audioStates = player.get('trip.tripState.audioStateByRole') || {};
      const audioState = audioStates[roleName];
      console.log('audioStates', audioStates);
      if (!audioState) {
        return;
      }
      this.makeAction('play_audio', {
        role_name: roleName,
        audio: audioState.url,
        title: audioState.title
      });
    }
  }
});
