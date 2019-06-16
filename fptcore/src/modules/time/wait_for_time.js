const moment = require('moment');

module.exports = {
  help: 'Wait a fixed period of time.',
  params: {
    until: {
      type: 'reference',
      collection: 'times',
      required: true,
      display: { label: false }
    }
  },
  getOps(params, actionContext) {
    const untilTimestamp = actionContext.evalContext.schedule[params.until];
    if (!untilTimestamp) {
      return [{
        operation: 'log',
        level: 'warning',
        message: `Could not find time matching "${params.until}".`
      }];
    }
    return [{
      operation: 'wait',
      until: moment.utc(untilTimestamp)
    }];
  }
};
