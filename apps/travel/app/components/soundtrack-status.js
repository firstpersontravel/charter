import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':playthrough-soundtrack',
    'hasAudio:active:inactive'
  ],

  audio: null,
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
    return !!this.get('audio');
  }.property('audio'),

  audioIsInProgress: function() {
    var audioState = this.get('audio');
    if (!audioState) { return false; }
    return this.get('audioTime') <= this.get('audioDuration');
  }.property('audio', 'audioTime'),

  audioIsPlaying: Ember.computed.bool('audio.is_playing'),
  audioIsPaused: Ember.computed.bool('audio.paused_time'),

  audioHasEnded: function() {
    var audioState = this.get('audio');
    if (!audioState) { return false; }
    return this.get('audioTime') > this.get('audioDuration');
  }.property('audio', 'audioTime'),

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
    var audioState = this.get('audio');
    if (!audioState) { return 0; }
    if (!audioState.is_playing) {
      return (audioState.paused_time || 0).toFixed(1);
    }
    var startedAt = audioState.started_at;
    var startedTime = audioState.started_time;
    var elapsedMsec = moment.utc().diff(startedAt);
    var currentTime = startedTime + elapsedMsec / 1000.0;
    return currentTime;
  }.property('audio', 'currentTime'),

  audioContent: function() {
    var audioName = this.get('audio.name');
    if (!audioName) { return null; }
    return this.get('script.content.audio').findBy('name', audioName);
  }.property('audio'),

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
