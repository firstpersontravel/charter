import Ember from 'ember';

export default Ember.Controller.extend({

  hasMultiplePlaythroughs: function() {
    return this.get('model.participants.length') > 1;
  }.property('model.participants')
});
