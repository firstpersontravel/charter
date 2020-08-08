import Ember from 'ember';

import WindowHeightMixin from '../../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['room-frame'],
  contentEl: '',
  footerEl: '.page-layout-tabs-menu',

  // params: shouldTransmit, useVideo, token, roomId

  isLoading: true,
  error: null,
  participants: null,
  localTracks: null,

  isEmpty: Ember.computed.not('participants.length'),

  init: function() {
    this._super();
    this.set('participants', []);
  },

  getLocalTracks: function() {
    if (!this.get('shouldTransmit')) {
      return Promise.resolve([]);
    }
    return Twilio.Video.createLocalTracks({
      audio: true,
      video: this.get('useVideo') ? { width: 640 } : false
    });
  },

  didInsertElement: function() {
    this._super();
    this.setupRoom();
  },

  willDestroyElement: function() {
    this.teardownRoom();
    this._super();
  },

  panelIdDidChange: function() {
    this.teardownRoom();
    this.setupRoom();
  }.observes('panelId'),

  setupRoom: function() {
    console.log('Entering room');
    this.set('isLoading', true);
    const token = this.get('token');
    const roomId = this.get('roomId');
    return this.getLocalTracks()
      .then(localTracks => {
        this.set('localTracks', localTracks);
        return Twilio.Video.connect(token, {
          name: roomId,
          tracks: localTracks
        });
      })        
      .then(
        room => this.onRoomConnected(room),
        err => this.onRoomConnectError(err)
      )
      .catch(err => {
        console.error(`Error initializing room: ${err.message}`);
        console.error(err.stack);
      });    
  },

  teardownRoom: function() {
    if (!this._room) {
      return;
    }
    for (const trackPublication of this._room.localParticipant.tracks) {
      if (trackPublication.track) {
        trackPublication.track.stop();
      }
    }
    this._room.disconnect();
    this._room = null;
  },

  onRoomConnected(room) {
    if (this.isDestroyed) {
      return;
    }
    console.log('onRoomConnected');
    this.set('isLoading', false);
    this._room = room;
    room.participants.forEach(p => this.onParticipantConnected(p));
    room.on('participantConnected', p => this.onParticipantConnected(p));
    room.on('participantDisconnected', p => this.onParticipantDisconnected(p));
    room.on('reconnecting', e => this.onRoomReconnecting(e));
    room.once('disconnected', () => this.onRoomDisconnected(room));
  },

  onRoomConnectError(err) {
    if (this.isDestroyed) {
      return;
    }
    console.log('onRoomConnectError');
    this.set('isLoading', false);
    // No access to camera.
    if (err.code === err.NOT_FOUND_ERR) {
      console.log('noRoomConnectError', err);
      this.set('error', 'Could not get access to camera.');
      return;
    }
    this.set('error', `Unable to connect to room: ${err.message}`);
  },

  onParticipantConnected: function(participant) {
    console.log(`A remote participant connected: ${participant}`, participant);
    this.get('participants').addObject(participant);
  },

  onParticipantDisconnected: function(participant) {
    console.log(`A remote participant disconnected: ${participant}`, participant);
    this.get('participants').removeObject(participant);
  },

  onRoomReconnecting: function(err) {
    if (err.code === 53001) {
      console.log('Reconnecting your signaling connection!', err.message);
    } else if (err.code === 53405) {
      console.log('Reconnecting your media connection!', err.message);
    }
  },

  onRoomDisconnected: function(room) {
    console.log('Room disconnected.');
    room.participants.forEach(p => {
      this.handleParticipantDisconnected && this.handleParticipantDisconnected(p);
    });
  }
});