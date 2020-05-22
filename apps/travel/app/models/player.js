import Ember from 'ember';
import DS from 'ember-data';
import RefUtils from '../utils/ref';

import fptCore from 'fptcore';

export default DS.Model.extend({
  trip: DS.belongsTo('trip', {async: false}),
  user: DS.belongsTo('user', {async: false}),
  roleName: DS.attr('string'),
  acknowledgedPageName: DS.attr('string'),
  acknowledgedPageAt: DS.attr('moment'),
  values: DS.attr('obj'),

  role: function() {
    return this.get('trip.script').getRole(this.get('roleName'));
  }.property('trip'),

  currentPageName: function() {
    return this.get('trip.tripState.currentPageNamesByRole')[
      this.get('roleName')];
  }.property('trip.tripState'),

  userProfile: function() {
    if (!this.get('user.profiles')) {
      return null;
    }
    var profiles = this.get('user.profiles')
      .filter(profile => (
        profile.get('roleName') === this.get('roleName') &&
        profile.get('experience') === this.get('trip.experience')
      ));
    return profiles[0] || null;
  }.property('user.profiles'),

  skype: Ember.computed.oneWay('userProfile.skype'),
  facetime: Ember.computed.oneWay('userProfile.facetime'),

  photo: function() {
    return this.get('userProfile.photo') || null;
  }.property('userProfile'),

  contactName: function() {
    return this.get('role.title');
  }.property('userProfile', 'user'),

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
  },

  humanizeText: function(text) {
    return fptCore.TemplateUtil.templateText(this.get('trip.evalContext'),
      text, this.get('trip.experience.timezone'), this.get('roleName'));
  }
});
