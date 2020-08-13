import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['room-item', 'room-participant'],

  localVideo: function() {
    return this.get('localTracks').find(t => t.kind === 'video');
  }.property('localTracks'),

  label: function() {
    // No video preview for self.
    if (!this.get('useVideo') || !this.get('shouldTransmit')) {
      return 'You are the only one here.';
    }
    // Otherwise we should have local video but don't, show error.
    return 'Cannot show preview.';
  }.property('shouldTransmit', 'useVideo', 'localVideo'),

  didInsertElement: function() {
    if (this.get('localVideo')) {
      this.$().append(this.get('localVideo').attach());
    }
  },
  willClearRender: function() {
    if (this.get('localVideo')) {
      this.get('localVideo').detach().forEach(el => el.remove());
    }    
  }
});