var moment = require('moment-timezone');

var ActionsRegistry = require('./registries/actions');
var EvalCore = require('./eval');
var TextCore = require('./text');
var TimeCore = require('./time');

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
ActionPhraseCore.timeForShorthand = function(shorthand, evaluateAt, context) {
  var words = shorthand.split(/\s+/);
  if (words[0].toLowerCase() === 'in') {
    var inSeconds = TimeCore.secondsForDurationShorthand(words[1]);
    return evaluateAt.clone().add(inSeconds, 'seconds');
  }
  if (words[0].toLowerCase() === 'at') {
    var atTimestamp = EvalCore.lookupRef(context, words[1]);
    return moment.utc(atTimestamp);
  }
  if (words[1].toLowerCase() === 'after') {
    var afterTimestamp = EvalCore.lookupRef(context, words[2]);
    var afterSecs = TimeCore.secondsForDurationShorthand(words[0]);
    return moment.utc(afterTimestamp).add(afterSecs, 'seconds');
  }
  if (words[1].toLowerCase() === 'before') {
    var beforeTimestamp = EvalCore.lookupRef(context, words[2]);
    var beforeSecs = TimeCore.secondsForDurationShorthand(words[0]);
    return moment.utc(beforeTimestamp).subtract(beforeSecs, 'seconds');
  }
  console.warn('Illegal time shorthand ' + shorthand);
  return evaluateAt.clone();
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
  var words = TextCore.splitWords(plainActionPhrase);
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
 * Parse an action shorthand (in 3m, do this) into an object containing action
 * name, params, and scheduleAt).
 */
ActionPhraseCore.expandActionPhrase = function(actionPhrase, evaluateAt,
  context) {
  // Break out modifier
  var modifierAndAction = ActionPhraseCore.extractModifier(actionPhrase);
  var modifierType = modifierAndAction[0];
  var modifier = modifierAndAction[1];
  
  // Parse action into and params
  var plainActionPhrase = modifierAndAction[2];
  var plainAction = ActionPhraseCore
    .expandPlainActionPhrase(plainActionPhrase);

  // Calculate schedule
  var scheduleAt = evaluateAt;
  if (modifierType === 'when') {
    scheduleAt = ActionPhraseCore.timeForShorthand(
      modifier, evaluateAt, context);
  }
  return {
    name: plainAction.name,
    params: plainAction.params,
    scheduleAt: scheduleAt
  };
};

module.exports = ActionPhraseCore;
