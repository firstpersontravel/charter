import Ember from 'ember';

export default Ember.Route.extend({

  environment: Ember.inject.service(),
  audio: Ember.inject.service(),
  location: Ember.inject.service(),

  setupController: function(controller, context) {
    this._super(controller, context);
    Ember.run.next(this, function() {
      // Start watching location -- only after application has initialized.
      // otherwise nogps wont be set correctly
      var shouldWatchGps = true;
      // Don't watch GPS if nogps flag is true
      if (this.controllerFor('application').get('nogps')) {
        shouldWatchGps = false;
      }
      if (shouldWatchGps) {
        this.get('location').startWatching();
      }
      // Start playing audio -- after application state has been initialized.
      this.controllerFor('player').updateAudioState();
    });
  }
});
