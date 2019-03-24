var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

module.exports = {
  help: {
    summary: 'A route is a path between one waypoint and another.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    from: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true
    },
    to: {
      type: 'reference',
      collection: 'waypoints',
      required: true
    },
    via: { type: 'list', items: { type: 'coords' } },
    mode: { type: 'enum', options: ROUTE_VIA_OPTIONS, default: 'driving' }
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.from];
  }
};
