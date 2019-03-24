var _ = require('lodash');

module.exports = {
  help: {
    summary: 'A geofence is a circular region around a waypoint. It can be used to trigger events when players enter or leave a region, or when messages are sent from within that region.'
  },
  properties: {
    name: { type: 'name', required: true },
    center: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true
    },
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
