import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('index', {path: '/'});
  this.route('login', {path: '/login'});
  this.route('participant', {path: '/u/:id', resetNamespace: true}, function() {
    // TODO: change to r ("run")
    this.route('trip', {path: '/p/:trip_id', resetNamespace: true}, function() {  
      this.route('page', {path: '/'});
      this.route('player', {path: '/p/:player_id', resetNamespace: true}, function() {
        this.route('page', {path: '/'});
      });
    });
  });
  this.route('not-found', { path: '/*wildcard' });
});

export default Router;
