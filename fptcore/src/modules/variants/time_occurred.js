var _ = require('lodash');
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
  help: { summary: 'Occurs when the current time reaches a scheduled time.' },
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
    // If it's after where we're checking up to, skip it... for now.
    if (specTime.isAfter(moment.unix(event.timestamp))) {
      return false;
    }
    // Otherwise, we're in the range!
    return true;
  },
  getTitle: function(scriptContent, spec) {
    var time = _.find(scriptContent.times, { name: spec.time });
    if (!time) {
      return null;
    }
    if (spec.before) {
      return spec.before + ' before "' + time.title + '"';
    }
    if (spec.after) {
      return spec.after + ' after "' + time.title + '"';
    }
    return 'at "' + time.title + '"';
  }
};
