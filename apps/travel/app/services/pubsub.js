import Ember from 'ember';

export default Ember.Service.extend({

  pubnubInstance: null,

  init: function() {
    this._super();
    var config = Ember.getOwner(this)._lookupFactory('config:environment');
    this.pubnubInstance = window.PUBNUB.init({
      publish_key: config.pubnubPublishKey,
      subscribe_key: config.pubnubSubscribeKey,
      ssl: true
    });
  },

  subscribe: function() {
    return this.pubnubInstance.subscribe.apply(this, arguments);
  },

  unsubscribe: function() {
    return this.pubnubInstance.unsubscribe.apply(this, arguments);
  },
});
