import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [
    ':trip-soundtrack',
    'hasAudio:active:inactive'
  ],

  values: null,
  script: null,
  duration: null,
  durationForUrl: null,

  init: function() {
    this._super();
    this._interval = setInterval(this.updateTime.bind(this), 1000);
  },

  didInsertElement: function() {
    this.audioUrlDidChange();
  },

  willDestroy: function() {
    this._super();
    clearInterval(this._interval);
  },

  updateTime: function() {
    this.set('currentTime', moment.utc());
  },

  hasAudio: function() {
    return this.get('audioRole') &&
      this.get('audioRole') === this.get('roleName') &&
      this.get('audioUrl');
  }.property('audioUrl'),

  audioIsInProgress: function() {
    if (!this.get('hasAudio')) { return false; }
    return this.get('audioTime') <= this.get('audioDuration');
  }.property('values', 'audioTime'),

  audioRole: Ember.computed.oneWay('values.audio_role'),
  audioUrl: Ember.computed.oneWay('values.audio_url'),
  audioIsPlaying: Ember.computed.bool('values.audio_is_playing'),
  audioIsPaused: Ember.computed.bool('values.audio_paused_time'),

  audioTitle: function() {
    return this.get('values.audio_title') || 'Soundtrack';
  }.property('values.audio_title'),

  audioUrlDidChange: function() {
    if (!this.get('hasAudio')) {
      this.set('duration', null);
      this.set('durationForUrl', null);
      return;
    }
    const audioUrl = this.get('audioUrl');
    if (this.get('durationForUrl') !== audioUrl) {
      const audioEl = new Audio();
      audioEl.addEventListener('loadedmetadata', () => {
        this.set('duration', audioEl.duration);
        this.set('durationForUrl', audioUrl);
      });
      audioEl.src = audioUrl;
    }
  }.observes('audioUrl'),

  audioIsLoading: Ember.computed.not('duration'),

  audioHasEnded: function() {
    if (!this.get('hasAudio')) { return false; }
    if (!this.get('audioDuration')) { return false; }
    return this.get('audioTime') > this.get('audioDuration');
  }.property('audioTitle', 'audioTime'),

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
    if (!this.get('hasAudio')) { return 0; }
    if (!this.get('audioIsPlaying')) {
      return (this.get('values.audio_paused_time') || 0).toFixed(1);
    }
    var startedAt = this.get('values.audio_started_at');
    var startedTime = this.get('values.audio_started_time');
    var elapsedMsec = moment.utc().diff(startedAt);
    var currentTime = startedTime + elapsedMsec / 1000.0;
    return currentTime;
  }.property('audio', 'currentTime'),

  audioDuration: Ember.computed.oneWay('duration'),

  actions: {
    mute: function() {
      this.triggerAction({action: 'mute'});
    },
    restartAudio: function() {
      this.triggerAction({action: 'restartAudio'});
    }
  }
});
