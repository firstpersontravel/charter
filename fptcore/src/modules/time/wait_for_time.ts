const moment = require('moment');

module.exports = {
  help: 'Wait for a moment to arrive.',
  title: 'Wait until moment',
  params: {
    until: {
      type: 'reference',
      collection: 'times',
      required: true,
      display: { label: false }
    }
  },
  getOps(params: any, actionContext: any) {
    const untilTimestamp = actionContext.evalContext.schedule[params.until];
    if (!untilTimestamp) {
      return [{
        operation: 'log',
        level: 'warn',
        message: `Could not find time matching "${params.until}".`
      }];
    }

    const waitUntil = moment.utc(untilTimestamp);

    // If the time has already passed, don't do anything.
    if (waitUntil.isBefore(actionContext.evaluateAt)) {
      return [];
    }

    return [{
      operation: 'wait',
      until: waitUntil
    }];
  }
};

export {};
