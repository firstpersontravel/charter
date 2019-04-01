var _ = require('lodash');
var moment = require('moment-timezone');

var TimeUtil = require('../utils/time');

var ActionPhraseCore = {};

/**
 * Parse an action when and offset modifiers into a time.
 */
ActionPhraseCore.scheduleAtForWhen = function(when, offset, actionContext) {
  var baseTimestamp = when ?
    actionContext.evalContext.schedule[when] :
    actionContext.evaluateAt;
  var offsetSecs = TimeUtil.secondsForOffsetShorthand(offset);
  return moment.utc(baseTimestamp).add(offsetSecs, 'seconds');
};

/**
 * Parse an action when modifier ("in 3m") into a time.
 */
ActionPhraseCore.unpackAction = function(action, actionContext) {
  var params = _.omit(action, 'name', 'when', 'offset');
  var scheduleAt = ActionPhraseCore.scheduleAtForWhen(action.when,
    action.offset, actionContext);
  return {
    name: action.name,
    params: params,
    scheduleAt: scheduleAt
  };
};

module.exports = ActionPhraseCore;
