var geofence = {
  properties: {
    name: { type: 'name', required: true },
    center: { type: 'reference', collection: 'waypoints', required: true },
    distance: { type: 'number', required: true }
  },
  getTitle: function(resource) {
    return resource.distance + 'm around ' + resource.center;
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.center];
  }
};

module.exports = {
  geofence: geofence
};
