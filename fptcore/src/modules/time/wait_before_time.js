const moment = require('moment');

const TimeUtil = require('../../utils/time');

module.exports = {
  help: 'Wait a fixed period of time before a scheduled time.',
  params: {
    time: {
      type: 'reference',
      collection: 'times',
      required: true,
      display: { label: false }
    },
    offset: {
      required: true,
      type: 'duration',
      display: { label: false }
    }
  },
  getOps(params, actionContext) {
    const untilTimestamp = actionContext.evalContext.schedule[params.until];
    const beforeSecs = TimeUtil.secondsForOffsetShorthand(params.offset);
    if (!untilTimestamp) {
      return [{
        operation: 'log',
        level: 'warning',
        message: `Could not find time matching "${params.until}".`
      }];
    }
    return [{
      operation: 'wait',
      until: moment.utc(untilTimestamp).subtract(beforeSecs, 'seconds')
    }];
  }
};
