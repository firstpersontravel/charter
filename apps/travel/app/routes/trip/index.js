import Ember from 'ember';

export default Ember.Route.extend({
  afterModel: function() {
    var script = this.modelFor('trip').get('script');
    var roleName = script.get('content.roles.firstObject.name');
    console.log('trip.index.afterModel -> transitionTo');
    return this.transitionTo('player.page', roleName);
  }
});
