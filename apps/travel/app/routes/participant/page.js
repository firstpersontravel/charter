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
      // Don't watch GPS if we're a native build.
      if (this.get('environment.isNative')) {
        shouldWatchGps = false;
      }
      if (shouldWatchGps) {
        var locationService = this.get('location');
        if (!locationService.get('isWatching')) {
          locationService.startWatching();
        }
      }
      // Start playing audio -- after application state has been initialized.
      this.controllerFor('participant').updateAudioState();
    });
  }
});
