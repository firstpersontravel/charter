var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

var route = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    from: { type: 'reference', collection: 'waypoints', required: true },
    to: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true
    },
    via: { type: 'list', items: { type: 'coords' } },
    mode: { type: 'enum', options: ROUTE_VIA_OPTIONS, default: 'driving' }
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.from];
  }
};

module.exports = {
  route: route
};
