import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['mute', 'debug', 'nogps', 'noack'],
  mute: false,
  debug: false,
  nogps: false,
  noack: false,
  audio: Ember.inject.service(),

  muteDidChange: function() {
    this.get('audio').set('mute', this.get('mute'));
  }.observes('mute').on('init')
});
