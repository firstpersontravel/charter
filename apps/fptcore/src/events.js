var _ = require('lodash');
var moment = require('moment');

var TimeCore = require('./time');

/**
 * Meters distance between two coordinate pairs.
 */
function latLngDistance(lat1, lng1, lat2, lng2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lng2 - lng1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d * 1000; // in meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

var Events = {};

Events.scene_started = {
  specParams: {
    self: { required: true, type: 'resource', collection: 'scenes' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec === event.scene;
  }
};

Events.cue_signaled ={
  specParams: {
    self: { required: true, type: 'cue_name' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec === event.cue;
  }
};

Events.geofence_entered = {
  specParams: {
    role: { required: true, type: 'resource', collection: 'roles' },
    geofence: { required: true, type: 'resource', collection: 'geofences' }
  },
  matchEvent: function(script, context, spec, event) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  }
};

Events.message_sent = {
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
      var geofence = _.find(script.content.geofences, 
        { name: spec.geofence });
      var waypoint = _.find(script.content.waypoints,
        { name: geofence.center });
      var dist = latLngDistance(
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
};

Events.call_answered = {
  specParams: {
    from: { required: true, type: 'resource', collection: 'roles' },
    to: { required: true, type: 'resource', collection: 'roles' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec.from === event.from && spec.to === event.to;
  }
};

Events.call_received = {
  specParams: {
    from: { required: true, type: 'resource', collection: 'roles' },
    to: { required: true, type: 'resource', collection: 'roles' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec.from === event.from && spec.to === event.to;
  }
};

Events.call_ended = {
  specParams: {
    role: { required: true, type: 'resource', collection: 'roles' }
  },
  matchEvent: function(script, context, spec, event) {
    return _.includes(event.roles, spec.role);
  }
};

Events.query_responded = {
  specParams: {
    query: { required: true, type: 'string' },
    partial: { required: false, type: 'boolean' },
    final: { required: false, type: 'boolean' }
  },
  matchEvent: function(script, context, spec, event) {
    if (spec.partial === true && event.partial === false) {
      return false;
    }
    if (spec.final === true && event.partial === true) {
      return false;
    }
    return spec.query === event.query;
  }
};

Events.time_occurred = {
  specParams: {
    time: { required: true, type: 'string' },
    before: { required: false, type: 'duration' },
    after: { required: false, type: 'duration' }
  },
  timeForSpec: function(context, spec) {
    var offset = 0;
    if (spec.after) {
      offset = TimeCore.secondsForDurationShorthand(spec.after);
    } else if (spec.before) {
      offset = -TimeCore.secondsForDurationShorthand(spec.before);
    }
    var timestring = context.schedule[spec.time];
    if (!timestring) {
      return null;
    }
    return moment.utc(timestring).add(offset, 'seconds');
  },
  matchEvent: function(script, context, spec, event) {
    var specTime = Events.time_occurred.timeForSpec(context, spec);
    if (!specTime) {
      return false;
    }
    // If there is a last timestemp that was checked, ignore any triggers
    // before that time, since those will have already been triggered.
    if (event.last_timestamp) {
      if (specTime.isSameOrBefore(moment.unix(event.last_timestamp))) {
        return false;
      }
    }
    // If it's after where we're checking up to, skip it... for now.
    if (specTime.isAfter(moment.unix(event.to_timestamp))) {
      return false;
    }
    // Otherwise, we're in the range!
    return true;
  }
};

module.exports = Events;
