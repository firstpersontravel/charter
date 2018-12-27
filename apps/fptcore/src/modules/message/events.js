var _ = require('lodash');

var distance = require('../../utils/distance');

module.exports = {
  message_sent: {
    specParams: {
      from: { required: false, type: 'resource', collection: 'roles' },
      to: { required: false, type: 'resource', collection: 'roles' },
      type: {
        required: false,
        type: 'enum',
        values: ['text', 'image', 'audio']
      },
      contains: { required: false, type: 'string' },
      geofence: { required: false, type: 'resource', collection: 'geofences' }
    },
    matchEvent: function(script, context, spec, event) {
      if (spec.type && spec.type !== event.message.type) {
        return false;
      }
      if (spec.from && spec.from !== event.message.from) {
        return false;
      }
      if (spec.to && spec.to !== event.message.to) {
        return false;
      }
      if (spec.contains) {
        if (event.message.content.toLowerCase().indexOf(
          spec.contains.toLowerCase()) === -1) {
          return false;
        }
      }
      if (spec.geofence) {
        if (!event.location.latitude || !event.location.longitude) {
          return false;
        }
        var geofence = _.find(script.content.geofences, { name: spec.geofence });
        var waypoint = _.find(script.content.waypoints, {
          name: geofence.center
        });
        var dist = distance(
          event.location.latitude, event.location.longitude,
          waypoint.coords[0], waypoint.coords[1]);
        // Don't let accuracy get wider than 15 meters, since that'd cause
        // erroneous triggers.
        var maxAccuracy = 15;
        var accuracy = Math.min(event.location.accuracy, maxAccuracy);
        // Add grace range of loc accuracy
        if (dist > (geofence.distance + accuracy)) {
          return false;
        }
      }
      // Pass all that, the message matches
      return true;
    }
  }
};
