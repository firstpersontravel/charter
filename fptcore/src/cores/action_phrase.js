const _ = require('lodash');
const moment = require('moment-timezone');

const TimeUtil = require('../utils/time');

class ActionPhraseCore {
  /**
   * Parse an action when and offset modifiers into a time.
   */
  static scheduleAtForWhen(when, offset, actionContext) {
    const baseTimestamp = when ?
      actionContext.evalContext.schedule[when] :
      actionContext.evaluateAt;
    const offsetSecs = TimeUtil.secondsForOffsetShorthand(offset);
    return moment.utc(baseTimestamp).add(offsetSecs, 'seconds');
  }

  /**
   * Parse an action when modifier ("in 3m") into a time.
   */
  static unpackAction(action, actionContext) {
    const params = _.omit(action, 'name', 'when', 'offset');
    const scheduleAt = this.scheduleAtForWhen(action.when, action.offset, 
      actionContext);
    return {
      name: action.name,
      params: params,
      scheduleAt: scheduleAt
    };
  }
}

module.exports = ActionPhraseCore;
