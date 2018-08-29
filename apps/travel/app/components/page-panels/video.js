import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-video'],
  fullPath: function() {
    var path = this.get('playthrough').humanizeText(this.get('params.path'));
    return this.get('playthrough.script').urlForContentPath(path);
  }.property('params'),

  poster: function() {
    var poster = this.get('params.poster');
    if (!poster) { return ''; }
    var posterPath = this.get('playthrough').humanizeText(poster);
    return this.get('playthrough.script').urlForContentPath(posterPath);
  }.property('params'),

  willClearRender: function() {
    this._super();
    this.$('video').src = '';
  },
});
