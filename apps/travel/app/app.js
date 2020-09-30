import Ember from 'ember';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

var App;

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver
});

loadInitializers(App, config.modulePrefix);

if (config.sentryDSN) {
  Sentry.init({
    dsn: config.sentryDSN,
    release: window.GIT_HASH || undefined,
    integrations: [new Sentry.Integrations.Ember()]
  });
}

export default App;
