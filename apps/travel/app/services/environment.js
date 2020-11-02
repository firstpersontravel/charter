import Ember from 'ember';

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

  contentPath: function() {
    const bucketName = BUCKETS[this.get('environmentName')];
    return `https://${bucketName}.s3.amazonaws.com`;
  }.property(),

  pubsubEnvironment: function() {
    return this.get('environmentName');
  }.property('environmentName'),

  apiHost: function() {
    return '';
  }.property('environmentName'),

  pubsubHost: Ember.computed.oneWay('apiHost'),

  host: function() {
    return '';
  }.property('environmentName')
});
