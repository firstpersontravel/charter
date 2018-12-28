var geofence = {
  properties: {
    name: { type: 'name', required: true },
    center: { type: 'reference', collection: 'waypoints', required: true },
    distance: { type: 'number', required: true }
  }
};

module.exports = {
  geofence: geofence
};
