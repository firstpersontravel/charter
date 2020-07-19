import Ember from 'ember';

export default Ember.Controller.extend({
  hasMultipleTrips: function() {
    return this.get('model.players.length') > 1;
  }.property('model.players')
});