import Ember from 'ember';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

const environments = {
  'charter.firstperson.travel': 'production',
  'app.firstperson.travel': 'production',
  'beta.firstperson.travel': 'staging',
  'preview.firstperson.travel': 'staging',
};

const environment = environments[window.location.hostname] || 'development';
const initSentry = environment !== 'development';

var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

if (initSentry) {
  Sentry.init({
    dsn: window.TRAVEL_SENTRY_DSN || null,
    environment: window.TRAVEL_SENTRY_ENVIRONMENT || 'development',
    release: window.GIT_HASH || undefined,
    integrations: [new Sentry.Integrations.Ember()]
  });
}

export default App;
