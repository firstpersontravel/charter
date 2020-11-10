import Ember from 'ember';

function hasLoggedIntoCreationTool() {
  return !!localStorage.getItem('auth_latest');
}

export default Ember.Controller.extend({
  queryParams: ['mute', 'debug', 'nogps', 'noack', 'groupactions'],

  mute: hasLoggedIntoCreationTool(),
  debug: hasLoggedIntoCreationTool(),
  nogps: hasLoggedIntoCreationTool(),
  noack: hasLoggedIntoCreationTool(),

  groupactions: null,

  audio: Ember.inject.service(),
  api: Ember.inject.service(),

  muteDidChange: function() {
    this.get('audio').set('mute', this.get('mute'));
  }.observes('mute').on('init'),

  groupactionsDidChange: function() {
    this.get('api').set('sendToGroupId', this.get('groupactions'));
  }.observes('groupactions').on('init')
});
