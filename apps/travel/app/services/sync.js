import Ember from 'ember';

const MAX_FAILS = 5;

export default Ember.Service.extend({

  pubsub: Ember.inject.service(),

  online: false,

  queue: null,
  inprogress: null,
  retriesByTask: null,

  errorDelay: 5000,

  init: function() {
    this._super();
    this.set('queue', []);
    this.set('online', window.navigator.onLine);
    this.set('retriesByTask', new Map());

    var self = this;

    window.addEventListener('offline', e => {
      self.set('online', false);
    });
    window.addEventListener('online', e => {
      self.set('online', true);
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

  fail() {
    if (!this.get('hasFailed')) {
      return;
    }
    this.set('hasFailed', true);
    swal({
      title: 'Error',
      text: 'We\'re sorry, there was an error syncing your action. Please press OK to refresh.',
    }, function() {
      window.location.reload();
    });
  },

  runNext: function() {
    if (!this.get('online')) { return; }
    if (!this.get('queue.length')) { return; }
    const task = this.get('queue').shift();
    this.set('inprogress', task);
    this.notifyPropertyChange('queue');
    task()
      .then(() => {
        // Re-insert remove task
        this.get('retriesByTask').delete(task);
        this.set('inprogress', null);
        this.runNext();
      })
      .catch(err => {
        if (err.status === 401) {
          // Our token expired!
          localStorage.removeItem('authToken');
          window.location.reload();
          return;
        }
        // Re-insert task on failure only if it's not a client error -- always re-insert
        // client errors and retry indefinitely.
        if (err.status !== -1) {
          const numFailures = (this.get('retriesByTask').get(task) || 0) + 1;
          if (numFailures > MAX_FAILS) {
            Sentry.captureException(new Error(
              `Network error failed > ${MAX_FAILS} times: ${err.status} ${err.message}`
            ));
            this.fail();
            return;
          }
          this.get('retriesByTask').set(task, numFailures);
        }
        this.set('inprogress', null);
        this.get('queue').insertAt(0, task);
        this.notifyPropertyChange('queue');
        // Run next in a second.
        Ember.run.later(this, this.runNext, this.errorDelay);
      });
  }
});
