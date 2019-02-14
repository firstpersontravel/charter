var _ = require('lodash');

var MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

var distance = require('../../utils/distance');

module.exports = {
  message_sent: {
    getTitle: function(scriptContent, spec) {
      var parts = [spec.medium || 'message'];
      if (spec.from) {
        var fromRole = _.find(scriptContent.roles, { name: spec.from });
        if (fromRole) {
          parts.push(fromRole.title);
        }
      }
      if (spec.to) {
        var toRole = _.find(scriptContent.roles, { name: spec.to });
        if (toRole) {
          parts.push('to ' + toRole.title);
        }
      }
      return parts.join(' ');
    },
    specParams: {
      from: { required: false, type: 'reference', collection: 'roles' },
      to: { required: false, type: 'reference', collection: 'roles' },
      medium: {
        required: false,
        type: 'enum',
        options: MESSAGE_MEDIUM_OPTIONS
      },
      contains: { required: false, type: 'string' },
      geofence: { required: false, type: 'reference', collection: 'geofences' }
    },
    matchEvent: function(spec, event, actionContext) {
      if (spec.medium && spec.medium !== event.message.medium) {
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
        var geofence = _.find(actionContext.scriptContent.geofences,
          { name: spec.geofence });
        var waypoint = _.find(actionContext.scriptContent.waypoints,
          { name: geofence.center });
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
