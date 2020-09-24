import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['room-item', 'room-participant'],

  hasVideo: false,
  hasAudio: false,

  hasTrack: function() {
    return this.get('hasAudio') || this.get('hasVideo');
  }.property('hasVideo', 'hasAudio'),

  hasNoTracks: Ember.computed.not('hasTrack'),
  hasNoVideo: Ember.computed.not('hasVideo'),

  init: function() {
    this._super();
    this._onTrackSubscribed = this.onTrackSubscribed.bind(this);
    this._onTrackUnsubscribed = this.onTrackUnsubscribed.bind(this);
  },

  didInsertElement: function() {
    const participant = this.get('participant');
    if (!participant) {
      return;
    }
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        this.onTrackSubscribed(publication.track);
      }
    });
    participant.on('trackSubscribed', this._onTrackSubscribed);
    participant.on('trackUnsubscribed', this._onTrackUnsubscribed);
  },

  willDestroyElement: function() { 
    const participant = this.get('participant');
    if (!participant) {
      return;
    }
    participant.off('trackSubscribed', this._onTrackSubscribed);
    participant.off('trackUnsubscribed', this._onTrackUnsubscribed);
  },

  onTrackSubscribed: function(track) {
    const $el = this.$();
    if (!$el) {
      console.error('Called onTrackSubscribed on unmounted component');
      return;
    }
    $el.append(track.attach());
    if (track.kind === 'video') {
      this.set('hasVideo', true);
    }
    if (track.kind === 'audio') {
      this.set('hasAudio', true);
    }
  },
  onTrackUnsubscribed: function(track) {
    track.detach().forEach(el => el.remove());
    if (track.kind === 'video') {
      this.set('hasVideo', false);
    }
    if (track.kind === 'audio') {
      this.set('hasAudio', false);
    }
  },
});