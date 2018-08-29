import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({

  environment: Ember.inject.service(),

  name: DS.attr('string'),
  title: DS.attr('string'),
  timezone: DS.attr('string'),
  version: DS.attr('number'),
  content: DS.attr('obj'),

  findResourceByName: function(resourceType, name) {
    var resources = this.get('content')[resourceType + 's'];
    var resource = resources.findBy('name', name);
    if (!resource) {
      throw new Error(`Could not find ${resourceType} ${name}.`);
    }
    return resource;
  },

  findPageByName: function(pageName) {
    return this.findResourceByName('page', pageName);
  },
  
  urlForContentPath: function(path) {
    if (!path) { return ''; }
    // Return live URL if it's a absolute url
    if (path.slice(0, 7) === 'http://') {
      if (window.location.protocol === 'https:') {
        return path.replace('http:', 'https:');
      }
      return path;
    }
    if (path.slice(0, 8) === 'https://') { return path; }

    var contentPath = this.get('environment.contentPath');
    var scriptFolder = this.get('name');
    return `${contentPath}/${scriptFolder}/${path}`;
  },

  getRoleNames: function() {
    return this.get('content.roles').mapBy('name');
  },

  getRole: function(roleName) {
    return this.findResourceByName('role', roleName);
  }
});
