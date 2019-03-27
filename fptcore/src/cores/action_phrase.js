var _ = require('lodash');
var moment = require('moment-timezone');

var ActionsRegistry = require('../registries/actions');
var EvalCore = require('./eval');
var TextUtil = require('../utils/text');
var TimeUtil = require('../utils/time');

var ActionPhraseCore = {};

/**
 * Parse a relative time reference from one of the following possibilities into
 * a utc moment object.
 *
 * - in 3m
 * - at TIME-VAR
 * - 1m after TIME-VAR
 * - 2s before TIME-VAR
 */
ActionPhraseCore.timeForShorthand = function(shorthand, actionContext) {
  var words = shorthand.split(/\s+/);
  if (words[0].toLowerCase() === 'in') {
    var inSeconds = TimeUtil.secondsForDurationShorthand(words[1]);
    return actionContext.evaluateAt.clone().add(inSeconds, 'seconds');
  }
  if (words[0].toLowerCase() === 'at') {
    var atTimestamp = EvalCore.lookupRef(actionContext.evalContext,
      words[1]);
    return moment.utc(atTimestamp);
  }
  if (words[1].toLowerCase() === 'after') {
    var afterTimestamp = EvalCore.lookupRef(actionContext.evalContext,
      words[2]);
    var afterSecs = TimeUtil.secondsForDurationShorthand(words[0]);
    return moment.utc(afterTimestamp).add(afterSecs, 'seconds');
  }
  if (words[1].toLowerCase() === 'before') {
    var beforeTimestamp = EvalCore.lookupRef(actionContext.evalContext,
      words[2]);
    var beforeSecs = TimeUtil.secondsForDurationShorthand(words[0]);
    return moment.utc(beforeTimestamp).subtract(beforeSecs, 'seconds');
  }
  console.warn('Illegal time shorthand ' + shorthand);
  return actionContext.evaluateAt.clone();
};

ActionPhraseCore.extractModifier = function(actionPhrase) {
  var indexOfSplitter = actionPhrase.indexOf(',');
  if (indexOfSplitter === -1) {
    return [null, null, actionPhrase];
  }
  var modifier = actionPhrase.substr(0, indexOfSplitter).trim();
  var plainAction = actionPhrase.substr(indexOfSplitter + 1).trim();
  var modifierType = modifier.substr(0, 2) === 'if' ? 'if' : 'when';
  return [modifierType, modifier, plainAction];
};

/**
 * Expand a plain phrase that doesn't include a schedule modifier.
 */
ActionPhraseCore.expandPlainActionPhrase = function(plainActionPhrase) {
  var words = TextUtil.splitWords(plainActionPhrase);
  var name = words[0];
  var actionClass = ActionsRegistry[name];
  if (!actionClass) {
    throw new Error('Unknown action ' + name);
  }
  var paramNames = actionClass.phraseForm || [];
  var params = {};
  words.slice(1)
    .forEach(function(arg, index) {
      if (paramNames && paramNames[index]) {
        params[paramNames[index]] = arg;
      }
    });
  return { name: name, params: params };
};

/**
 * Parse an action shorthand (in 3m, do this) into an object containing a
 * packed action: name, params, and when shorthand.
 */
ActionPhraseCore.parseActionPhrase = function(actionPhrase) {
  // Break out modifier
  var modifierAndAction = ActionPhraseCore.extractModifier(actionPhrase);
  var modifierType = modifierAndAction[0];
  var modifier = modifierAndAction[1];
  
  // Parse action into and params
  var plainActionPhrase = modifierAndAction[2];
  var plainAction = ActionPhraseCore.expandPlainActionPhrase(
    plainActionPhrase);

  return Object.assign(
    { name: plainAction.name },
    plainAction.params,
    (modifierType === 'when') ? { when: modifier } : null
  );
};

/**
 * Parse an action when modifier ("in 3m") into a time.
 */
ActionPhraseCore.scheduleAtForWhen = function(when, actionContext) {
  return when ?
    ActionPhraseCore.timeForShorthand(when, actionContext) :
    actionContext.evaluateAt;
};

/**
 * Parse an action when modifier ("in 3m") into a time.
 */
ActionPhraseCore.unpackAction = function(action, actionContext) {
  var params = _.omit(action, 'name', 'when');
  var scheduleAt = ActionPhraseCore.scheduleAtForWhen(action.when,
    actionContext);
  return {
    name: action.name,
    params: params,
    scheduleAt: scheduleAt
  };
};

module.exports = ActionPhraseCore;
