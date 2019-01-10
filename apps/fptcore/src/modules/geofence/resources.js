var geofence = {
  title: function(resource) {
    return resource.distance + 'm around ' + resource.center;
  },
  properties: {
    name: { type: 'name', required: true },
    center: { type: 'reference', collection: 'waypoints', required: true },
    distance: { type: 'number', required: true }
  }
};

module.exports = {
  geofence: geofence
};
