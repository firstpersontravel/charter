var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

module.exports = {
  icon: 'compass',
  help: 'A path between one waypoint and another, including walking/driving directions. If one of the waypoints has multiple options, then multiple paths will be fetched.',
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
