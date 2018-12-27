var moment = require('moment');

var TimeCore = require('../time');

function timeForSpec(context, spec) {
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
}

module.exports = {
  specParams: {
    time: { required: true, type: 'string' },
    before: { required: false, type: 'duration' },
    after: { required: false, type: 'duration' }
  },
  timeForSpec: timeForSpec,
  matchEvent: function(script, context, spec, event) {
    var specTime = timeForSpec(context, spec);
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
