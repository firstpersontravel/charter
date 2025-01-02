import Ember from 'ember';

function hasLoggedIntoCreationTool() {
  return !!localStorage.getItem('auth_latest');
}

export default Ember.Controller.extend({
  queryParams: ['mute', 'debug', 'nogps', 'noack'],

  mute: hasLoggedIntoCreationTool(),
  debug: hasLoggedIntoCreationTool(),
  nogps: hasLoggedIntoCreationTool(),
  noack: hasLoggedIntoCreationTool(),

  audio: Ember.inject.service(),
  api: Ember.inject.service(),

  muteDidChange: function() {
    this.get('audio').set('mute', this.get('mute'));
  }.observes('mute').on('init')
});
