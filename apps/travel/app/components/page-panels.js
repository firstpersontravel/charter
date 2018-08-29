import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['page-panels'],
  target: Ember.computed.alias('targetObject')
});
