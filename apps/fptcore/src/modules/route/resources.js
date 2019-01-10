var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

var route = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    from: { type: 'reference', collection: 'waypoints', required: true },
    to: { type: 'reference', collection: 'waypoints', required: true },
    via: { type: 'list', items: { type: 'coords' } },
    mode: { type: 'enum', options: ROUTE_VIA_OPTIONS, default: 'driving' }
  }
};

module.exports = {
  route: route
};
