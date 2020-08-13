import Ember from 'ember';

import WindowHeightMixin from '../../mixins/panels/window-height';

let hasReceivedInput = false;

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['page-panel-room', 'room-frame'],
  contentEl: '',
  footerEl: '.page-layout-tabs-menu',

  api: Ember.inject.service(),
  environment: Ember.inject.service(),

  panelId: Ember.computed.oneWay('params.id'),
  useVideo: Ember.computed.oneWay('params.video'),
  shouldTransmit: Ember.computed.oneWay('params.transmit'),

  hasReceivedInput: Ember.computed({
    get(key) {
      return hasReceivedInput;
    },
    set(key, value) {
      hasReceivedInput = value;
      return hasReceivedInput;
    }
  }),

  enterDescription: function() {
    const isTransmitting = this.get('shouldTransmit');
    const useVideo = this.get('useVideo');
    if (isTransmitting) {
      return `You will start sharing ${useVideo ? 'video' : 'audio'}.`;
    }
    return `You will not share audio or video.`;
  }.property(),

  isBrowserSupported: function() {
    return Twilio.Video.isSupported;
  }.property(),

  browserMessage: function() {
    if (navigator.userAgent.match('CriOS')) {
      return 'Chrome on iOS is not supported. Please use Safari.';
    }
    if (!Twilio.Video.isSupported) {
      return 'This browser is not supported.';
    }
    return null;
  }.property(),

  getLocalTracks() {
    if (!this.get('shouldTransmit')) {
      return Promise.resolve([]);
    }
    return Twilio.Video.createLocalTracks({
      audio: true,
      video: this.get('useVideo') ? { width: 640 } : false
    });
  },

  roomId: function() {
    const envName = this.get('environment.environmentName');
    const tripId = this.get('trip.id');
    const roomName = this.get('params.name') || 'default';
    return `${envName}-${tripId}-${roomName}`;
  }.property('params'),

  actions: {
    enterRoom: function() {
      this.set('hasReceivedInput', true);
    }
  }
});
