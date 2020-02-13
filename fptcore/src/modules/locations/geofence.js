var _ = require('lodash');

module.exports = {
  icon: 'map-pin',
  help: 'A circular region around a waypoint. It can be used to trigger events when players enter or leave a region, or when messages are sent from within that region.',
  properties: {
    name: { type: 'name', required: true },
    center: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true,
      help: 'Center of the geofence.'
    },
    distance: {
      type: 'number',
      required: true,
      help: 'Distance in meters around the center that is counted as within the geofence.'
    }
  },
  getTitle: function(scriptContent, resource) {
    var waypoint = _.find(scriptContent.waypoints, { name: resource.center });
    return resource.distance + 'm around ' + waypoint.title;
  }
};
