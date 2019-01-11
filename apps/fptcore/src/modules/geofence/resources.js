var _ = require('lodash');

var geofence = {
  properties: {
    name: { type: 'name', required: true },
    center: { type: 'reference', collection: 'waypoints', required: true },
    distance: { type: 'number', required: true }
  },
  getTitle: function(scriptContent, resource) {
    var waypoint = _.find(scriptContent.waypoints, { name: resource.center });
    return resource.distance + 'm around ' + waypoint.title;
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.center];
  }
};

module.exports = {
  geofence: geofence
};
