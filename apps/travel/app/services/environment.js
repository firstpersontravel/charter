import Ember from 'ember';

const WEB_HOSTS = {
  development: 'http://localhost:5001',
  staging: 'https://staging.firstperson.travel',
  production: 'https://app.firstperson.travel'
};

const PUBSUB_HOSTS = {
  development: 'http://localhost:5002',
  staging: 'https://staging.firstperson.travel:5002',
  production: 'https://app.firstperson.travel:5002'
};

const NATIVE_HOSTS = {
  development: 'https://firstpersontravel.ngrok.io',
  staging: 'https://staging.firstperson.travel',
  production: 'https://app.firstperson.travel'
};

// Served from port 8080 on native WKWebView
const IS_NATIVE = window.location.host.indexOf(':8080') > -1;
const NATIVE_CONTENT_PATH = '/media';
const WEB_CONTENT_PATH = 'https://fpt-agency-content.s3.amazonaws.com';
const HOSTS = IS_NATIVE ? NATIVE_HOSTS : WEB_HOSTS;

export default Ember.Service.extend({

  environmentName: null,

  init: function() {
    this._super();
    var config = Ember.getOwner(this)._lookupFactory('config:environment');
    var local_environment_name = localStorage.getItem('environment_name');
    this.set('environmentName', local_environment_name || config.environment);
  },

  updateEnvironment: function(newName) {
    if (!HOSTS[newName]) {
      throw new Error('invalid environment name ' + newName);
    }
    localStorage.setItem('environment_name', newName);
    this.set('environmentName', newName);
  },

  environmentOptions: function() {
    return Object.keys(HOSTS);
  }.property(),

  hostForEnvironment: function(env) {
    return HOSTS[env];
  },

  isNative: function() {
    return IS_NATIVE;
  }.property(),

  contentPath: function() {
    return IS_NATIVE ? NATIVE_CONTENT_PATH : WEB_CONTENT_PATH;
  }.property(),

  pubsubEnvironment: function() {
    return this.get('environmentName');
  }.property('environmentName'),

  apiHost: function() {
    return IS_NATIVE ? HOSTS[this.get('environmentName')] : '';
  }.property('environmentName'),

  pubsubHost: function() {
    return PUBSUB_HOSTS[this.get('environmentName')];
  }.property('environmentName'),

  host: function() {
    return HOSTS[this.get('environmentName')];
  }.property('environmentName')
});
