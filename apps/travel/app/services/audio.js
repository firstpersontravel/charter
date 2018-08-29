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

  play: function(path, time) {
    this._play(path, time);
  },

  fadeOut: function() {
    this._stop();
  },

  _play: function(path, time) {    
    if (path !== this._path) {
      this._stop();
    }

    // If native, play audio
    if (window.webkit && 
        window.webkit.messageHandlers &&
        window.webkit.messageHandlers.play_audio &&
        window.webkit.messageHandlers.play_audio.postMessage) {
      // In the native app, only the headlands gamble media is already
      // loaded, and in just the /media bundle folder.
      window.webkit.messageHandlers.play_audio.postMessage({
        path: path.replace('/media/theheadlandsgamble', '/media'),
        time: time
      });
      return;
    }

    var startedAt = new Date();
    if (this._hasAudioPermission) {
      this._start(path, startedAt, time);
    } else {
      swal({
        title: 'Please tap to continue'
      }, function() {
        this._hasAudioPermission = true;
        this._start(path, startedAt, time);
      }.bind(this));
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
    this._audio.play();
    this.set('isPlaying', true);
  },

  _start: function(path, startedAt, time) {
    this._startedAt = startedAt;
    this._startAtTime = time; 
    this._path = path;
    this._audio.src = path;
    this._audio.load();
  },

  _stop: function() {
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
  },

  onAudioCanPlay: function() {
    var elapsedFromStart = new Date().getTime() - this._startedAt.getTime();
    this._startPlaying(this._startAtTime + (elapsedFromStart / 1000.0));
  }
});
