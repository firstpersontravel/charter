import Ember from 'ember';

export default Ember.Service.extend({

  pubsub: Ember.inject.service(),

  online: false,

  queue: null,
  inprogress: null,

  errorDelay: 15000,

  init: function() {
    this._super();
    this.set('queue', []);

    var self = this;
    this.get('pubsub').subscribe({
      channel: "meta_connection_state", 
      restore: true,
      callback: function() {},
      disconnect: function() {
        self.set('online', false);
      },
      reconnect: function() {
        self.set('online', true);
      },
      connect: function() {
        self.set('online', true);
      }
    });
  },

  onlineDidChange: function() {
    if (this.get('online')) {
      this.runNext();
    }
  }.observes('online'),

  add: function(task) {
    this.get('queue').push(task);
    this.notifyPropertyChange('queue');
    this.runNext();
  },

  hasPending: function() {
    return !!this.get('queue.length');
  }.property('queue.length'),

  runNext: function() {
    if (!this.get('online')) { return; }
    if (!this.get('queue.length')) { return; }
    var self = this;
    var task = this.get('queue').shift();
    this.set('inprogress', task);
    this.notifyPropertyChange('queue');
    task()
      .then(function() {
        // Re-insert remove task
        self.set('inprogress', null);
        self.runNext();
      })
      .catch(function(err) {
        // Re-insert task on failure
        console.error(err);
        self.set('inprogress', null);
        self.get('queue').insertAt(0, task);
        self.notifyPropertyChange('queue');
        // Run next in a second.
        Ember.run.later(self, self.runNext, self.errorDelay);
      });
  }
});
