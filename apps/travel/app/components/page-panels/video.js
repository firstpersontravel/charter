import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-video'],
  fullPath: Ember.computed.oneWay('params.video'),

  willClearRender: function() {
    this._super();
    this.$('video').src = '';
  },
});
