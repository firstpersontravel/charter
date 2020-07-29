import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel-audio-foreground'],
  fullPath: Ember.computed.oneWay('params.audio')
});
