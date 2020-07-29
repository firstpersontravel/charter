import Ember from 'ember';

export default Ember.Service.extend({
  _hasAudioPermission: false,
  _audio: null,
  _path: null,

  isPlaying: false,

  init: function() {
    this._super();
    this._audio = new Audio();
    this._audio.addEventListener('ended', this.onAudioEnded.bind(this));
    this._audio.addEventListener('canplay', this.onAudioCanPlay.bind(this));
  },

  willDestroy: function() {
    this._super();
    this._audio.src = '';
    this._audio.removeEventListener('ended');
    this._audio.removeEventListener('canplay');
    this._audio = null;    
  },

  play: function(url, time) {
    this._kickoff(url, time);
  },

  fadeOut: function() {
    if (!this.get('isPlaying')) { 
      return;
    }
    this._stopPlaying();
  },

  _kickoff: function(url, time) {
    // If we're already playing, just need to change time.
    if (url === this._url && this.get('isPlaying')) {
      this._audio.currentTime = time;
      return;
    }
    if (url !== this._url) {
      this._stopPlaying();
    }

    // If native, play audio
    if (window.webkit && 
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.play_audio &&
        window.webkit.messageHandlers.play_audio.postMessage) {
      // In the native app, only the headlands gamble media is already
      // loaded, and in just the /media bundle folder.
      window.webkit.messageHandlers.play_audio.postMessage({
        path: url,
        time: time
      });
      return;
    }

    var startedAt = new Date();
    this._load(url, startedAt, time);
  },

  _load: function(url, startedAt, time) {
    this._startedAt = startedAt;
    this._startAtTime = time; 
    this._url = url;
    this._audio.src = url;
    this._audio.load();
    // If already ready, play now
    if (this._audio.readyState >= this._audio.HAVE_FUTURE_DATA) {
      this._startOrAskPermission();
    }
  },

  _startOrAskPermission: function() {
    // Once we can play, we should also have duration
    var elapsedFromStart = new Date().getTime() - this._startedAt.getTime();
    var dur = this._audio.duration;
    var startAtTime = this._startAtTime + (elapsedFromStart / 1000.0);
    if (startAtTime > dur) {
      this._stopPlaying();
      return;
    }

    if (this._hasAudioPermission) {
      this._startPlaying(startAtTime);
    } else {
      swal({ title: 'Please tap to start audio' }, () => {
        this._hasAudioPermission = true;
        this._startPlaying(startAtTime);
      });
    }  
  },

  _startPlaying: function(time) {
    if (time && time > 0) {
      this._audio.currentTime = time;
      // Don't start audio if we're later than the duration.
      if (this._audio.duration && time > this._audio.duration) {
        return;
      }
    }
    this._audio.play().then(() => {
      this.set('isPlaying', true);
    }, err => {
      console.error('err playing', err);
    });
  },

  _stopPlaying: function() {
    if (!this.get('isPlaying')) {
      return;
    }
    this.set('isPlaying', false);

    // If native, play audio
    if (window.webkit && 
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.stop_audio &&
        window.webkit.messageHandlers.stop_audio.postMessage) {
      window.webkit.messageHandlers.stop_audio.postMessage({});
      return;
    }

    this._audio.pause();
    this._audio.src = ''; 
  },

  onAudioEnded: function() {
    this.set('isPlaying', false);
    this._audio.src = ''; 
  },

  onAudioCanPlay: function() {
    if (!this.get('isPlaying')) {
      this._startOrAskPermission();
    }
  }
});
