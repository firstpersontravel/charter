var moment = require('moment');

var TimeUtil = require('../../utils/time');

function timeForSpec(spec, evalContext) {
  var offset = 0;
  if (spec.after) {
    offset = TimeUtil.secondsForDurationShorthand(spec.after);
  } else if (spec.before) {
    offset = -TimeUtil.secondsForDurationShorthand(spec.before);
  }
  var timestring = evalContext.schedule[spec.time];
  if (!timestring) {
    return null;
  }
  return moment.utc(timestring).add(offset, 'seconds');
}

module.exports = {
  time_occurred: {
    parentResourceParam: 'time',
    specParams: {
      time: { required: true, type: 'reference', collection: 'times' },
      before: { required: false, type: 'duration' },
      after: { required: false, type: 'duration' }
    },
    timeForSpec: timeForSpec,
    matchEvent: function(spec, event, actionContext) {
      var specTime = timeForSpec(spec, actionContext.evalContext);
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
  }
};
