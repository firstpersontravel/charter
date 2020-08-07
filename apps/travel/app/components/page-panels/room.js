import Ember from 'ember';

import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['page-panel-room'],
  contentEl: '.room-container',
  footerEl: '.page-layout-tabs-menu',

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  videoError: null,
  room: null,
  localTracks: [],
  participantsBySid: {},

  hasVideo: Ember.computed.oneWay('params.video'),
  shouldTransmit: Ember.computed.oneWay('params.transmit'),

  getLocalTracks() {
    if (!this.get('shouldTransmit')) {
      return Promise.resolve([]);
    }
    return Twilio.Video.createLocalTracks({
      audio: true,
      video: this.get('hasVideo') ? { width: 640 } : false
    });
  },

  didInsertElement: function() {
    if (navigator.userAgent.match('CriOS')) {
      this.set('videoError', 'Chrome on iOS is not supported. Please use Safari.');
      return;
    }
    const envName = this.get('environment.environmentName');
    const tripId = this.get('trip.id');
    const videoToken = this.get('trip.videoToken');
    if (!videoToken) {
      this.set('videoError', 'No video token.');
      return;
    }
    const roomName = this.get('params.name') || 'default';
    const roomId = `${envName}-${tripId}-${roomName}`;
    return this.getLocalTracks()
      .then(localTracks => {
        this.set('localTracks', localTracks);
        return Twilio.Video.connect(videoToken, {
          name: roomId,
          tracks: localTracks
        });
      })        
      .then(
        room => this.handleRoomConnect(room),
        err => this.handleRoomConnectError(err)
      )
      .catch(err => {
        console.error(`Error initializing room: ${err.message}`);
        console.error(err.stack);
      });
  },

  willDestroyElement: function() {
    console.log('Tearing down room');
    const room = this.get('room');
    if (room) {
      for (const trackPublication of this.room.localParticipant.tracks) {
        if (trackPublication.track) {
          trackPublication.track.stop();
        }
      }
      room.disconnect();
    }
    this.set('videoError', null);
    this.set('room', null);
    this.set('localTracks', null);
    this.set('participantsBySid', null);
  },

  handleRoomConnectError(err) {
    // No access to camera.
    if (err.code === err.NOT_FOUND_ERR) {
      console.log('handleRoomConnectError', err);
      this.set('videoError', 'Could not get access to camera.');
      return;
    }
    this.set('videoError', `Unable to connect to room: ${err.message}`);
  },

  handleRoomConnect(room) {
    this.set('room', room);
    this.set('participantsBySid', {});
    console.log(`Successfully joined a room: ${room}`);
    room.participants.forEach(p => this.handleParticipantConnect(p));
    room.on('participantConnected', p => this.handleParticipantConnect(p));
    room.on('participantDisconnected', p => this.handleParticipantDisconnect(p));
    room.on('reconnecting', e => this.handleRoomReconnecting(e));
    room.once('disconnected', () => this.handleRoomDisconnected(room));
    this.handleParticipantUpdate();
  },

  handleRoomDisconnected(room) {
    console.log('Room disconnected.');
    room.participants.forEach(p => this.handleParticipantDisconnect(p));
    this.set('room', null);
  },

  handleRoomReconnecting(error) {
    if (error.code === 53001) {
      console.log('Reconnecting your signaling connection!', error.message);
    } else if (error.code === 53405) {
      console.log('Reconnecting your media connection!', error.message);
    }
  },

  handleParticipantConnect(participant) {
    if (!this.get('room')) {
      return;
    }
    console.log(`A remote participant connected: ${participant}`, participant);
    this.set('participantsBySid', Object.assign({}, this.get('participantsBySid'), {
      [participant.sid]: participant
    }));

    const div = document.createElement('div');
    div.classList = ["room-participant"];
    div.id = participant.sid;
    // div.innerText = participant.identity;
  
    participant.on('trackSubscribed',
      track => this.handleTrackSubscribed(div, track));
    participant.on('trackUnsubscribed',
      track => this.handleTrackUnsubscribed(track));
  
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        this.handleTrackSubscribed(div, publication.track);
      }
    });
  
    const container = document.getElementsByClassName('room-participants')[0];
    container.appendChild(div);
    this.handleParticipantUpdate();
  },

  handleParticipantDisconnect(participant) {
    console.log(`A remote participant disconnected: ${participant}`);
    const participantsBySid = this.get('participantsBySid');
    delete participantsBySid[participant.sid];
    this.set('participantsBySid', Object.assign({}, participantsBySid));
    const div = document.getElementById(participant.sid);
    if (div) {
      div.remove();
    }
    if (this.get('room')) {
      this.handleParticipantUpdate();
    }
  },

  handleParticipantUpdate() {
    const numParticipants = Object.keys(this.get('participantsBySid')).length;
    // If we have video, show self preview when no participants.
    if (this.get('hasSelfPreview')) {
      const videoTrack = this.get('localTracks').find(t => t.kind === 'video');
      if (numParticipants === 0) {
        const localMediaEl = document.getElementsByClassName('room-self-preview')[0];
        localMediaEl.appendChild(videoTrack.attach());
      } else {
        videoTrack.detach().forEach(element => element.remove());
      }
    }
    // Otherwise message will be handled
  },

  handleTrackSubscribed(div, track) {
    console.log(`A track subscribed: ${track}`, track);
    div.appendChild(track.attach());
  },
  
  handleTrackUnsubscribed(track) {
    console.log(`A track unsubscribed: ${track}`, track);
    track.detach().forEach(element => element.remove());
  },

  hasSelfPreview: function() {
    return this.get('hasVideo') &&
      this.get('shouldTransmit') &&
      this.get('localTracks.length') === 2;
  }.property('hasVideo', 'shouldTransmit', 'localTracks'),

  numParticipants: function() {
    return Object.keys(this.get('participantsBySid')).length;
  }.property('participantsBySid'),

  hasParticipants: function() {
    return !!this.get('numParticipants');
  }.property('numParticipants'),

  roomIsEmpty: Ember.computed.not('hasParticipants'),

  roomParticipantsClassName: function() {
    const numParticipants = this.get('numParticipants');
    if (numParticipants <= 1) {
      return 'room-participants-solo';
    }
    if (numParticipants <= 4) {
      return 'room-participants-grid-2';
    }
    return 'room-participants-grid-3';
  }.property('numParticipants')
});
