import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('index', {path: '/'});
  this.route('login', {path: '/login'});
  this.route('logout', {path: '/logout'});
  this.route('trip', {path: '/:trip_id/:player_id', resetNamespace: true}, function() {  
    this.route('page', {path: '/'});
    this.route('player', {path: '/', resetNamespace: true}, function() {
      this.route('page', {path: '/'});
    });
  });
  this.route('not-found', { path: '/*wildcard' });
});

export default Router;
