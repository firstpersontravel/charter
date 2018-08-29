import Ember from 'ember';

export default Ember.Component.extend({
  classNameBindings: [':sync-status', 'syncStatusClass'],
  sync: Ember.inject.service(),

  syncStatusClass: function() {
    var online = this.get('sync.online');
    return online ? 'sync-status-online' : 'sync-status-offline';
  }.property('sync.online')
});
