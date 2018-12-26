import Ember from 'ember';

export default Ember.Service.extend({

  environment: Ember.inject.service(),

  init: function() {
    this._super();
    var host = this.get('environment.apiHost');
    this._client = new Faye.Client(`${host}/pubsub`);
    this._subscriptions = {};
  },

  subscribe: function(channel, onMessage) {
    if (this._subscriptions[channel]) {
      this.unsubscribe(channel);
    }
    this._subscriptions[channel] = this._client.subscribe(channel, onMessage);
  },

  unsubscribe: function(channel) {
    if (!this._subscriptions[channel]) {
      return;
    }
    this._subscriptions[channel].cancel();
    delete this._subscriptions[channel];
  },
});
