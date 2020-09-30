import Ember from 'ember';

import WindowHeightMixin from '../../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNameBindings: [':room-frame', 'layoutClassName'],
  contentEl: '',
  footerEl: '.page-layout-tabs-menu',

  // params: shouldTransmit, useVideo, token, roomId

  isLoading: true,
  error: null,
  participants: null,
  localTracks: null,

  isEmpty: Ember.computed.not('participants.length'),

  // Don't show local if we have one remote participant -- since
  // full screen is nice. But show otherwise - empty or gallery.
  shouldShowLocal: function() {
    return this.get('participants.length') !== 1;
  }.property('participants.length'),

  numSpacesUsed: function() {
    return (
      (this.get('shouldShowLocal') ? 1 : 0) +
      this.get('participants.length'));
  }.property('shouldShowLocal', 'participants.length'),

  numSpacesTotal: function() {
    const numUsed = this.get('numSpacesUsed');
    return numUsed <= 1 ? 1 : (numUsed <= 4 ? 4 : 9);
  }.property('numSpacesUsed'),

  numEmpties: function() {
    return this.get('numSpacesTotal') - this.get('numSpacesUsed');
  }.property('numSpacesUsed', 'numSpacesTotal'),
      
  layoutClassName: function() {
    return `layout-${this.get('numSpacesTotal')}`;
  }.property('numSpacesTotal'),

  empties: function() {
    const empties = [];
    for (let i = 0; i < this.get('numEmpties'); i++) {
      empties.push(i);
    }
    return empties;
  }.property('numEmpties'),

  init: function() {
    this._super();
    this.set('participants', []);
  },

  getLocalTracks: function() {
    // if (!this.get('shouldTransmit')) {
    //   return Promise.resolve([]);
    // }
    try {
      return Twilio.Video
        .createLocalTracks({
          audio: true,
          video: this.get('useVideo') ? { width: 640 } : false
        })
        .then(localTracks => {
          // Mute local audio track if we're not supposed to be transmitting. This is to work
          // around an iOS issue where when not transmitting, sound wasn't playing.
          const audioTrack = localTracks.find(t => t.kind === 'audio');
          if (audioTrack && !this.get('shouldTransmit')) {
            audioTrack.disable();
          }
          return localTracks
        });
    } catch (err) {
      return Promise.reject(err);
    }
  },

  didInsertElement: function() {
    this._super();
    this.setupRoom();
  },

  willDestroyElement: function() {
    this.teardownRoom();
    this._super();
  },

  panelIdDidChange: function(sender, key, value, rev) {
    this.teardownRoom();
    this.setupRoom();
  }.observes('panelId'),

  setupRoom: function() {
    console.log('Entering room');
    this.set('isLoading', true);
    const token = this.get('token');
    const roomId = this.get('roomId');
    return this.getLocalTracks().then(
      localTracks => this.onLocalTracksSuccess(localTracks),
      err => this.onLocalTracksError(err));
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

  onLocalTracksSuccess(localTracks) {
    this.set('localTracks', localTracks);
    return Twilio.Video
      .connect(token, { name: roomId, tracks: localTracks })
      .then(
        room => this.onRoomConnected(room),
        err => this.onRoomConnectError(err));
  },

  onLocalTracksError(err) {
    if (this.isDestroyed) {
      return;
    }
    this.set('error', `Error initializing room: ${err.message}`);
    this.set('isLoading', false);
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
    this.onResize();
  },

  onRoomConnectError(err) {
    if (this.isDestroyed) {
      return;
    }
    console.log('onRoomConnectError');
    this.set('isLoading', false);
    // No access to camera.
    if (err.code === err.NOT_FOUND_ERR) {
      this.set('error', `Could not get access to camera: ${err.message}.`);
      return;
    }
    this.set('error', `Unable to connect to room: ${err.message}`);
  },

  onParticipantConnected: function(participant) {
    console.log(`A remote participant connected: ${participant}`, participant);
    this.get('participants').addObject(participant);
    this.onResize();
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