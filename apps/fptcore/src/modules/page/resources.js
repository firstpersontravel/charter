var SubresourcesRegistry = require('../../registries/subresources');

var page = {
  properties: {
    name: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    role: { type: 'reference', collection: 'roles', required: true },
    title: { type: 'string', required: true },
    appearance: { type: 'reference', collection: 'appearances' },
    directive: { type: 'string' },
    layout: { type: 'reference', collection: 'layouts', allowNull: true },
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
  }
};

module.exports = {
  page: page
};
