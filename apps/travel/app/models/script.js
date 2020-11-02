import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

  environment: Ember.inject.service(),

  version: DS.attr('number'),
  content: DS.attr('obj'),

  timezone: Ember.computed.oneWay('experience.timezone'),

  experience: DS.belongsTo('experience', {async: false}),
  org: DS.belongsTo('org', {async: false}),

  findResourceByName: function(resourceType, name) {
    var resources = this.get('content')[resourceType + 's'];
    var resource = (resources || []).findBy('name', name);
    if (!resource) {
      throw new Error(`Could not find ${resourceType} ${name}.`);
    }
    return resource;
  },

  findPageByName: function(pageName) {
    return this.findResourceByName('page', pageName);
  },

  getRoleNames: function() {
    return this.get('content.roles').mapBy('name');
  },

  getRole: function(roleName) {
    return this.findResourceByName('role', roleName);
  }
});
