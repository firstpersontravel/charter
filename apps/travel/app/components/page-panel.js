import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panel'],
  target: Ember.computed.alias('targetObject')
});
