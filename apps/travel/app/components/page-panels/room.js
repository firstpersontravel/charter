import Ember from 'ember';

import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['page-panel-room'],
  contentEl: '.room-container',
  footerEl: '.page-layout-tabs-menu',

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  init: function() {
    this._super();
    const envName = this.get('environment.environmentName');
    const tripId = this.get('trip.id');
    const videoToken = this.get('trip.videoToken');
    const roomName = this.get('params.name') || 'default';
    const roomId = `${envName}-${tripId}-${roomName}`;
    const opts = {
      name: roomId,
      audio: !!this.get('params.transmit'),
      video: this.get('params.video') ? { width: 640 } : false
    };

    Twilio.Video.connect(videoToken, opts)
      .then(
        room => this.handleRoomConnect(room),
        err => this.handleRoomConnectError(err)
      )
      .catch(err => {
        console.error(`Error initializing room: ${err.message}`);
      });
  },

  willDestroy: function() {
    if (this.room) {
      for (const trackPublication of this.room.localParticipant.tracks) {
        if (trackPublication.track) {
          trackPublication.track.stop();
        }
      }
      this.room.disconnect();
      this.room = null;
    }
  },

  handleRoomConnectError(err) {
    // No access to camera.
    if (err.code === err.NOT_FOUND_ERR) {
      this.set('videoError', 'Could not get access to camera.');
      return;
    }
    this.set('videoError', `Unable to connect to room: ${err.message}`);
  },

  handleRoomConnect(room) {
    this.room = room;
    console.log(`Successfully joined a room: ${room}`);
    room.participants.forEach(p => this.handleParticipantConnect(p));
    room.on('participantConnected', p => this.handleParticipantConnect(p));
    room.on('participantDisconnected', p => this.handleParticipantDisconnect(p));
    room.on('reconnecting', e => this.handleRoomReconnecting(e));
    room.once('disconnected', () => this.handleRoomDisconnected(room));
  },

  handleRoomDisconnected(room) {
    console.log('Room disconnected.');
    room.participants.forEach(p => this.participantDisconnected(p));
  },

  handleRoomReconnecting(error) {
    if (error.code === 53001) {
      console.log('Reconnecting your signaling connection!', error.message);
    } else if (error.code === 53405) {
      console.log('Reconnecting your media connection!', error.message);
    }
  },

  handleParticipantConnect(participant) {
    console.log(`A remote participant connected: ${participant}`);

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
  
    const container = document.getElementsByClassName('room-container')[0];
    container.appendChild(div);
  },

  handleParticipantDisconnect(participant) {
    console.log(`A remote participant disconnected: ${participant}`);
    const div = document.getElementById(participant.sid);
    if (div) {
      div.remove();
    }
  },

  handleTrackSubscribed(div, track) {
    console.log(`A track subscribed: ${track}`);
    div.appendChild(track.attach());
  },
  
  handleTrackUnsubscribed(track) {
    console.log(`A track unsubscribed: ${track}`);
    track.detach().forEach(element => element.remove());
  }
});
