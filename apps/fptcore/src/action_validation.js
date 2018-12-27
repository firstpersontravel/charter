var _ = require('lodash');

var ActionsRegistry = require('./registries/actions');
var ParamValidators = require('./utils/param_validators');

var ActionValidationCore = {};

/**
 * Check a single param and return null or an error message.
 */
ActionValidationCore.checkParam = function(script, name, spec, param) {
  if (!ParamValidators[spec.type]) {
    throw new Error('Invalid param type "' + spec.type + '".');
  }
  return ParamValidators[spec.type](script, name, spec, param);
};

/**
 * Get action.
 */
ActionValidationCore.getAction = function(name) {
  return ActionsRegistry[name];
};

/**
 * Check the action and return a list of warnings.
 */
ActionValidationCore.checkAction = function(script, action) {
  var actionClass = ActionValidationCore.getAction(action.name);
  if (!actionClass) {
    return ['Invalid action "' + action.name + '".'];
  }
  if (!actionClass.params) {
    throw new Error('Expected action ' + action.name + ' to have params.');
  }
  var warnings = [];
  // Check for required params
  Object.keys(actionClass.params).forEach(function(paramName) {
    var paramSpec = actionClass.params[paramName];
    var param = action.params[paramName];
    if (_.isUndefined(param)) {
      if (paramSpec.required) {
        warnings.push('Required param "' + paramName + '" not present.');
      }
    } else {
      warnings = warnings.concat(
        ActionValidationCore.checkParam(script, paramName, paramSpec, param) ||
        []);
    }
  });
  // Check for unexpected params
  Object.keys(action.params).forEach(function(paramName) {
    if (!actionClass.params[paramName]) {
      warnings.push('Unexpected param "' + paramName + '".');
    }
  });
  return warnings;
};

ActionValidationCore.precheckAction = function(script, action, trigger) {
  // Gather normal checks
  var warnings = ActionValidationCore.checkAction(script, action);
  // And add trigger checks.
  var actionClass = ActionValidationCore.getAction(action.name);
  if (actionClass.requiredContext) {
    // Check that the trigger event type matches the required context.
    var triggerEventType = Object.keys(trigger.event || {})[0] || null;
    if (!_.includes(actionClass.requiredContext, triggerEventType)) {
      warnings.push(
        'Required context ' +
        actionClass.requiredContext
          .map(function(s) { return '"' + s + '"'; })
          .join(' or ') +
        ' not present.');
    }
  }
  return warnings;
};

/**
 * Validate the action and throw an error if it's not valid.
 */
ActionValidationCore.validateActionAtRun = function(script, context, action) {
  // Gather normal checks
  var warnings = ActionValidationCore.checkAction(script, action);
  // Runtime validation of requiredContext
  var actionClass = ActionValidationCore.getAction(action.name);
  if (actionClass.requiredContext) {
    if (!context.event) {
      warnings.push(
        'Required context ' +
        actionClass.requiredContext
          .map(function(s) { return '"' + s + '"'; })
          .join(' or ') +
        ' but executed without event.'
      );
    } else if (!_.includes(actionClass.requiredContext, context.event.type)) {
      warnings.push(
        'Required context ' +
        actionClass.requiredContext
          .map(function(s) { return '"' + s + '"'; })
          .join(' or ') +
        ' but executed with event "' + context.event.type + '".'
      );
    }
  }
  // Throw error if present
  if (warnings.length > 0) {
    throw new Error('Error validating "' + action.name + '": ' + warnings[0]);
  }
  return;
};

module.exports = ActionValidationCore;
