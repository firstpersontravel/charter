const moment = require('moment');

const TimeUtil = require('../../utils/time');

module.exports = {
  help: 'Wait a fixed period of time before a scheduled time.',
  params: {
    until: {
      type: 'reference',
      collection: 'times',
      required: true,
      display: { label: false }
    },
    before: {
      required: true,
      help: 'A time offset, i.e. 1h, 30s, 4.2m',
      type: 'timeOffset',
      display: { label: false }
    }
  },
  getOps(params, actionContext) {
    const untilTimestamp = actionContext.evalContext.schedule[params.until];
    const beforeSecs = TimeUtil.secondsForOffsetShorthand(params.before);
    if (!untilTimestamp) {
      return [{
        operation: 'log',
        level: 'warn',
        message: `Could not find time matching "${params.until}".`
      }];
    }
    const waitUntil = moment
      .utc(untilTimestamp)
      .subtract(beforeSecs, 'seconds');

    // If the time has already passed, don't do anything.
    if (waitUntil.isBefore(actionContext.evaluateAt)) {
      return [];
    }

    return [{ operation: 'wait', until: waitUntil }];
  }
};
