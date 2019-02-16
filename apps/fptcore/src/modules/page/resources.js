// var _ = require('lodash');

var SubresourcesRegistry = require('../../registries/subresources');

var page = {
  help: {
    summary: 'A page is a user interface that can be displayed to a player. It is comprised of panels, each of which is a unit of functionality.'
  },
  properties: {
    name: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true, parent: true },
    role: { type: 'reference', collection: 'roles', required: true, parent: true },
    title: { type: 'string', required: true },
    appearance: { type: 'reference', collection: 'appearances' },
    directive: { type: 'string' },
    layout: {
      type: 'reference',
      collection: 'layouts',
      allowNull: true,
      display: { hidden: true }
    },
    waypoint: { type: 'reference', collection: 'waypoints' },
    route: { type: 'reference', collection: 'routes' },
    panels: {
      type: 'list',
      items: { type: 'subresource', class: SubresourcesRegistry.panel }
    }
  },
  validateResource: function(script, resource) {
    if (resource.route && resource.waypoint) {
      return ['Page resource cannot have both a route and a waypoint.'];
    }
  },
  getParentClaims: function(resource) {
    return resource.appearance ?
      ['appearances.' + resource.appearance] :
      ['roles.' + resource.role];
  },
  getChildClaims: function(resource) {
    // return _(resource.panels)
    //   .filter('cue')
    //   .map(function(panel) {
    //     return 'cues.' + panel.cue;
    //   })
    //   .value();
  }
};

module.exports = {
  page: page
};
