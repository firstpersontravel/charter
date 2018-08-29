var _ = require('lodash');
var update = require('immutability-helper');

var ActionResultCore = {};

/**
 * Immutability helper doesn't fill in intermediate objects if you try to set
 * say a deep property without first creating the intermediates. This function
 * does that for you.
 */
ActionResultCore.autovivify = function(obj, updates) {
  if (typeof updates !== 'object') {
    return;
  }
  Object.keys(updates).forEach(function(key) {
    if (key[0] === '$') {
      return;
    }
    if (typeof obj[key] === 'undefined') {
      obj[key] = {};
    }
    ActionResultCore.autovivify(obj[key], updates[key]);
  });
};

ActionResultCore.TEMP_KEY_MAPS = {
  currentPageName: 'currentPageName',
  currentSceneName: 'currentSceneName',
  history: 'history'
};

/**
 * Update an object with updates, honoring temporary key maps.
 */
ActionResultCore.tempUpdateObject = function(obj, updates) {
  // Super hacky way to do a deep clone.
  var updated = _.cloneDeep(obj);
  Object.keys(updates).forEach(function(key) {
    if (key === 'values') {
      // vivify
      ActionResultCore.autovivify(updated, updates.values);
      // set
      updated = update(updated, updates.values);
    } else if (!_.isUndefined(ActionResultCore.TEMP_KEY_MAPS[key])) {
      var contextKey = ActionResultCore.TEMP_KEY_MAPS[key];
      if (contextKey) {
        updated[contextKey] = update(updated[contextKey] || {}, updates[key]);
      }
    } else {
      throw new Error('Bad key for temp update: ' + key);
    }
  }, this);
  return updated;
};

/**
 * Go through result ops from a given action, and update the context with the
 * results. This is a temporary stub designed to update the context in order
 * to allow processing to continue... the real update will happen after the
 * whole order processing is complete by resultOps handling.
 */
ActionResultCore.tempUpdateContextFromResultOp = function(context, resultOp) {
  switch (resultOp.operation) {
  case 'updateParticipant': {
    context = Object.assign({}, context);  // Shallow clone
    context[resultOp.roleName] = ActionResultCore.tempUpdateObject(
      context[resultOp.roleName], resultOp.updates);
    break;
  }
  case 'updatePlaythrough': {
    context = Object.assign({}, context);  // Shallow clone
    context = ActionResultCore.tempUpdateObject(context, resultOp.updates);
    break;
  }
  // everything else we can ignore
  }
  return context;
};

/**
 * Go through result ops from a given action, and update the context with the
 * results. This is a temporary stub designed to update the context in order
 * to allow processing to continue... the real update will happen after the
 * whole order processing is complete by resultOps handling.
 */
ActionResultCore.tempUpdateContext = function(context, resultOps) {
  resultOps.forEach(function(resultOp) {
    context = ActionResultCore.tempUpdateContextFromResultOp(
      context, resultOp);
  });
  return context;
};

/**
 * Get an object representing a blank action result.
 */
ActionResultCore.initialResult = function(context) {
  return { nextContext: context, resultOps: [], scheduledActions: [] };
};

/**
 * Get an object representing a simple application of ops to a context
 */
ActionResultCore.resultFromContextAndOps = function(context, ops) {
  var nextContext = ActionResultCore.tempUpdateContext(context, ops);
  return {
    nextContext: nextContext,
    resultOps: ops,
    scheduledActions: []
  };
};

/**
 * Concatenate two action result objects.
 */
ActionResultCore.concatResult = function(existing, nextResult) {
  return {
    nextContext: nextResult.nextContext,
    resultOps: existing.resultOps.concat(nextResult.resultOps),
    scheduledActions: existing.scheduledActions
      .concat(nextResult.scheduledActions)
  };
};

module.exports = ActionResultCore;
