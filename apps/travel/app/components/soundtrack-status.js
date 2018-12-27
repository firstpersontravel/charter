import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':trip-soundtrack',
    'hasAudio:active:inactive'
  ],

  values: null,
  script: null,

  init: function() {
    this._super();
    this._interval = setInterval(this.updateTime.bind(this), 1000);
  },

  willDestroy: function() {
    this._super();
    clearInterval(this._interval);
  },

  updateTime: function() {
    this.set('currentTime', moment.utc());
  },

  hasAudio: function() {
    return !!this.get('audioName');
  }.property('audioName'),

  audioIsInProgress: function() {
    var audioState = this.get('audioName');
    if (!audioState) { return false; }
    return this.get('audioTime') <= this.get('audioDuration');
  }.property('values', 'audioTime'),

  audioName: Ember.computed.oneWay('values.audio_name'),
  audioIsPlaying: Ember.computed.bool('values.audio_is_playing'),
  audioIsPaused: Ember.computed.bool('values.audio_paused_time'),

  audioHasEnded: function() {
    var audioState = this.get('audioName');
    if (!audioState) { return false; }
    return this.get('audioTime') > this.get('audioDuration');
  }.property('audioName', 'audioTime'),

  audioElapsed: function() {
    var mins = Math.floor(this.get('audioTime') / 60);
    var secs = Math.floor(this.get('audioTime') - mins * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }.property('audioTime'),

  audioRemaining: function() {
    var remaining = this.get('audioDuration') - this.get('audioTime');
    var mins = Math.floor(remaining / 60);
    var secs = Math.floor(remaining - mins * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }.property('audioTime'),

  audioTime: function() {
    if (!this.get('audioName')) { return 0; }
    if (!this.get('audioIsPlaying')) {
      return (this.get('values.audio_paused_time') || 0).toFixed(1);
    }
    var startedAt = this.get('values.audio_started_at');
    var startedTime = this.get('values.audio_started_time');
    var elapsedMsec = moment.utc().diff(startedAt);
    var currentTime = startedTime + elapsedMsec / 1000.0;
    return currentTime;
  }.property('audio', 'currentTime'),

  audioContent: function() {
    var audioName = this.get('audioName');
    if (!audioName) { return null; }
    return this.get('script.content.audio').findBy('name', audioName);
  }.property('audioName'),

  audioDuration: function() {
    if (!this.get('audioContent')) { return null; }
    return this.get('audioContent').duration * 60;
  }.property('audio'),

  actions: {
    mute: function() {
      this.triggerAction({action: 'mute'});
    },
    restartAudio: function() {
      this.triggerAction({action: 'restartAudio'});
    }
  }
});
