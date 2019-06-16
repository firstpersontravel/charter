const TimeUtil = require('../../utils/time');

module.exports = {
  help: 'Wait a fixed period of time.',
  params: {
    duration: {
      required: true,
      type: 'duration',
      display: { label: false }
    }
  },
  getOps(params, actionContext) {
    const durationSecs = TimeUtil.secondsForOffsetShorthand(params.duration);
    const until = actionContext.evaluateAt
      .clone()
      .add(durationSecs, 'seconds');
    return [{
      operation: 'wait',
      until: until
    }];
  }
};
