var _ = require('lodash');
var moment = require('moment');

var TimeUtil = require('../../utils/time');

function timeForSpec(spec, evalContext) {
  var offset = spec.offset ? TimeUtil.secondsForOffsetShorthand(spec.offset) :
    0;
  var timestring = evalContext.schedule[spec.time];
  if (!timestring) {
    return null;
  }
  return moment.utc(timestring).add(offset, 'seconds');
}

module.exports = {
  help: 'Occurs when the current time reaches a scheduled time.',
  specParams: {
    time: {
      required: true,
      type: 'reference',
      collection: 'times',
      display: { label: false }
    },
    offset: {
      required: false,
      help: 'A time offset, e.g. 1h, 30s, 4.2m, -10s, -1.5h',
      type: 'timeOffset'
    }
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
    if (spec.offset) {
      var offset = TimeUtil.secondsForOffsetShorthand(spec.offset);
      if (offset < 0) {
        return spec.offset.substr(1) + ' before "' + time.title + '"';
      }
      return spec.offset + ' after "' + time.title + '"';
    }
    return 'at "' + time.title + '"';
  }
};
