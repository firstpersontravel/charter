const TimeUtil = require('../../utils/time').default;
import type { ActionContext } from '../../types';

export default {
  help: 'Wait a fixed period of time.',
  params: {
    duration: {
      required: true,
      type: 'timeOffset',
      help: 'A duration, i.e. 1h, 30s, 4.2m',
      display: { label: false }
    }
  },
  getOps(params: Record<string, any>, actionContext: ActionContext) {
    const durationSecs = TimeUtil.secondsForOffsetShorthand(params.duration);
    return [{ operation: 'wait', seconds: durationSecs }];
  }
};

