import Ember from 'ember';

export default Ember.Controller.extend({

  location: Ember.inject.service(),
  audio: Ember.inject.service(),
  application: Ember.inject.controller(),

  lastFixDidChange: function() {
    var lastFix = this.get('location.lastFix');
    if (!lastFix || !lastFix.timestamp || !lastFix.coords) { return; }
    var participant = this.get('model');
    var lastFixAt = moment.utc(lastFix.timestamp);
    var currentFixAt = participant.get('user.locationTimestamp');
    if (lastFixAt < currentFixAt) { return; }
    this.send('updateLocation', lastFix);
  }.observes('location.lastFix').on('init'),

  currentPageDidChange: function() {
    if (this.get('application.noack')) {
      return;
    }
    Ember.run.next(() => {
      this.send('acknowledgePage', this.get('model.currentPageName'));
    });
  }.observes('model.currentPageName'),

  updateAudioState: function() {
    var audioState = this.get('model.values.audio');
    var muted = this.get('application.mute');

    // Check if unchanged.
    if (audioState === this._lastAudioState && muted === this._lastMuted) {
      return;
    }
    this._lastAudioState = audioState;
    this._lastMuted = muted;

    if (muted || !audioState || !audioState.is_playing || !audioState.path) {
      this.get('audio').fadeOut();
      return;
    }
    var startedAt = audioState.started_at;
    var startedTime = audioState.started_time;
    var elapsedMsec = moment.utc().diff(startedAt);
    var currentTime = startedTime + elapsedMsec / 1000.0;
    var script = this.get('model.playthrough.script');
    var path = script.urlForContentPath(audioState.path);
    this.get('audio').play(path, currentTime);
  },

  actions: {
    mute: function() {
      this.get('application').toggleProperty('mute');
      this.updateAudioState();
    }
  }
});
