import Ember from 'ember';

const WEB_HOSTS = {
  development: 'http://localhost:5001',
  staging: 'https://beta.firstperson.travel',
  production: 'https://charter.firstperson.travel'
};

const BUCKETS = {
  development: 'fpt-agency-content-local',
  staging: 'fpt-agency-content-staging',
  production: 'fpt-agency-content'
};

export default Ember.Service.extend({

  environmentName: null,

  init: function() {
    this._super();
    var config = Ember.getOwner(this)._lookupFactory('config:environment');
    var local_environment_name = localStorage.getItem('environment_name');
    this.set('environmentName', local_environment_name || config.environment);
  },

  hostForEnvironment: function(env) {
    return WEB_HOSTS[env];
  },

  contentPath: function() {
    const bucketName = BUCKETS[this.get('environmentName')];
    return `https://${bucketName}.s3.amazonaws.com`;
  }.property(),

  pubsubEnvironment: function() {
    return this.get('environmentName');
  }.property('environmentName'),

  apiHost: function() {
    return WEB_HOSTS[this.get('environmentName')];
  }.property('environmentName'),

  pubsubHost: Ember.computed.oneWay('apiHost'),

  host: function() {
    return WEB_HOSTS[this.get('environmentName')];
  }.property('environmentName')
});
