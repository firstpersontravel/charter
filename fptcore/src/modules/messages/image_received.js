var _ = require('lodash');

var WaypointCore = require('../../cores/waypoint');
var distance = require('../../utils/distance');

module.exports = {
  help: 'Occurs when am image message has been received.',
  getTitle: function(scriptContent, spec) {
    var parts = ['image'];
    if (spec.geofence) {
      parts.push('within geofence');
    }
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
    from: {
      required: false,
      type: 'reference',
      collection: 'roles',
      help: 'The sender of the message.'
    },
    to: {
      required: false,
      type: 'reference',
      collection: 'roles',
      help: 'The recipient of the message.'
    },
    geofence: {
      required: false,
      type: 'reference',
      collection: 'geofences',
      help: 'Optionally, a geofence within which the message must have been sent.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    if (event.message.medium !== 'image') {
      return false;
    }
    if (spec.from && spec.from !== event.message.from) {
      return false;
    }
    if (spec.to && spec.to !== event.message.to) {
      return false;
    }
    if (spec.geofence) {
      if (!event.location.latitude || !event.location.longitude) {
        return false;
      }

      var geofence = _.find(actionContext.scriptContent.geofences,
        { name: spec.geofence });

      var waypointOption = WaypointCore.optionForWaypoint(
        actionContext.scriptContent, geofence.center,
        actionContext.evalContext.waypointOptions);

      var dist = distance(
        event.location.latitude, event.location.longitude,
        waypointOption.coords[0], waypointOption.coords[1]);

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
};
