import Ember from 'ember';

export default Ember.Controller.extend({
  queryParams: ['mute', 'debug', 'nogps', 'noack', 'groupactions'],
  mute: false,
  debug: false,
  nogps: false,
  noack: false,
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
