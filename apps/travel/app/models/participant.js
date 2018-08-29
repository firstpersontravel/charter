import Ember from 'ember';
import DS from 'ember-data';
import RefUtils from '../utils/ref';

export default DS.Model.extend({
  playthrough: DS.belongsTo('playthrough', {async: false}),
  user: DS.belongsTo('user', {async: false}),
  roleName: DS.attr('string'),
  currentPageName: DS.attr('string'),
  acknowledgedPageName: DS.attr('string'),
  acknowledgedPageAt: DS.attr('moment'),
  values: DS.attr('obj'),

  role: function() {
    return this.get('playthrough.script').getRole(this.get('roleName'));
  }.property('playthrough'),

  userProfile: function() {
    if (!this.get('user.profiles')) {
      return null;
    }
    var profiles = this.get('user.profiles')
      .filter(profile => (
        profile.get('roleName') === this.get('roleName') &&
        profile.get('scriptName') === this.get('playthrough.script.name')
      ));
    return profiles[0] || null;
  }.property('user.profiles'),

  skype: Ember.computed.oneWay('userProfile.skype'),
  facetime: Ember.computed.oneWay('userProfile.facetime'),

  photo: function() {
    return this.get('userProfile.photo') || null;
  }.property('userProfile'),

  contactName: function() {
    if (this.get('role.actor')) {
      return this.get('role.contact_name') || this.get('role.name');
    } else if (this.get('user')) {
      return `${this.get('user.firstName')} ${this.get('user.lastName')}`;
    } else {
      return '';
    }
  }.property('userProfile', 'user'),

  isActor: function() {
    return this.get('role.actor') || false;
  }.property('playthrough'),

  firstName: function() {
    return this.get('contactName').split(' ')[0];
  }.property('contactName'),

  setValue: function(valueRef, newValue) {
    this.setValues([[valueRef, newValue]]);
  },

  setValues: function(valuePairs) {
    var valuesCopy = Ember.$.extend(true, {}, this.get('values'));
    valuePairs.forEach(function(arr) {
      RefUtils.updateValues(valuesCopy, arr[0], arr[1]);
    });
    this.set('values', valuesCopy);
  }
});
