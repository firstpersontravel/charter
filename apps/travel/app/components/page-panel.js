import Ember from 'ember';

let oldPanel = null;

export default Ember.Component.extend({
  classNames: ['page-panel'],
  target: Ember.computed.alias('targetObject')
});
