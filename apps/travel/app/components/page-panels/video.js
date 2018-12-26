import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-video'],
  fullPath: function() {
    var path = this.get('trip').humanizeText(this.get('params.path'));
    return this.get('trip.script').urlForContentPath(path);
  }.property('params'),

  poster: function() {
    var poster = this.get('params.poster');
    if (!poster) { return ''; }
    var posterPath = this.get('trip').humanizeText(poster);
    return this.get('trip.script').urlForContentPath(posterPath);
  }.property('params'),

  willClearRender: function() {
    this._super();
    this.$('video').src = '';
  },
});
