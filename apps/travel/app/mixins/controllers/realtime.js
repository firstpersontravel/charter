import Ember from 'ember';

export default Ember.Mixin.create({
  subscribedChannel: null,
  channelFormat: null,

  mergedProperties: ['realtimeEvents'],

  pubsub: Ember.inject.service(),

  unsubscribe: function() {
    console.log('unsubscribe', this.get('subscribedChannel'));
    Ember.assert("Must be subscribed.", !!this.get('subscribedChannel'));
    try {
      this.get('pubsub').unsubscribe(this.get('subscribedChannel'));
    } catch(err) {
      console.error('error unsubscribing' + err.message);
    }
    this.set('subscribedChannel', null);
  },

  subscribe: function(channelName) {
    Ember.assert("Must be unsubscribed.", !this.get('subscribedChannel'));
    this.get('pubsub').subscribe(channelName, this.onMessage.bind(this));
    this.set('subscribedChannel', channelName);
  },

  onMessage: function(message) {
    console.log('onMessage', message);
    // ignore realtime messages from same client
    // if(message.source_id === self.api._clientId) { return; }
    
    // ignore realtime messages with no events
    if(!message.type) { return; }
    var channel = this.get('subscribedChannel');
    Ember.Logger.info(`${channel}: ${message.type}`);
    var eventName = Ember.String.camelize(message.type);
    var handler = Ember.get(this, 'realtimeEvents.' + eventName);
    if(handler) {
      handler.call(this, message.content);
    } else {
      Ember.Logger.debug('no handler on ' + this.constructor +
        ' for realtime event ' + eventName + '.');
    }
  },

  modelDidChange: function() {
    this.updateSubscription();
  }.observes('model').on('init'),

  updateSubscription: function() {
    var objId = this.get('model.id');
    var channelFormat = this.get('channelFormat');
    if (!channelFormat) { return; }

    var oldChannelName = this.get('subscribedChannel');
    var newChannelName = null;
    if(objId) {
      newChannelName = channelFormat.replace('@id', objId);
    }
    if(newChannelName === oldChannelName) { return; }
    Ember.Logger.debug('channel switch', oldChannelName, '->', newChannelName);
    if(oldChannelName) { this.unsubscribe(); }
    if(newChannelName) { this.subscribe(newChannelName); }
  }
});
