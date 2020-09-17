import Ember from 'ember';

import WindowHeightMixin from '../../mixins/panels/window-height';

export default Ember.Component.extend(WindowHeightMixin, {
  classNames: ['page-panel-room', 'room-frame'],
  contentEl: '',
  footerEl: '.page-layout-tabs-menu',

  api: Ember.inject.service(),
  audio: Ember.inject.service(),
  environment: Ember.inject.service(),

  panelId: Ember.computed.oneWay('params.id'),
  useVideo: Ember.computed.oneWay('params.video'),
  shouldTransmit: Ember.computed.oneWay('params.transmit'),

  hasEntered: false,

  didInsertElement: function() {
    this._super();
    console.log('room-panel.didInsertElement');
  },

  willClearRender: function() {
    this._super();
    console.log('room-panel.willClearRender');
  },

  willDestroyElement: function() {
    this._super();
    console.log('room-panel.willDestroyElement');
  },
  
  shouldShowEntryway: function() {
    // If we've entered already, jump right in
    if (this.get('hasEntered')) {
      return false;
    }
    // If we are transmitting, always show permission
    if (this.get('shouldTransmit')) {
      return true;
    }
    // If we don't have permission, show
    if (!this.get('audio.hasPlayPermission')) {
      return true;
    }
    // Otherwise jump right in.
    return false;
  }.property('hasEntered', 'audio.hasPlayPermission', 'shouldTransmit'),

  // Reset on changing panel
  didChangePanel: function() {
    console.log('didChangePanel');
    this.set('hasEntered', false);
  }.observes('panelId'),

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

  roomId: function() {
    const envName = this.get('environment.environmentName');
    const groupId = this.get('trip.group.id');
    const roomName = this.get('params.name') || 'default';
    return `${envName}-${groupId}-${roomName}`;
  }.property('params'),

  actions: {
    enterRoom: function() {
      this.set('hasEntered', true);
      this.set('audio.hasPlayPermission', true);
    }
  }
});
