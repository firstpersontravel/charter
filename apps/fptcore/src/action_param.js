var _ = require('lodash');

var ActionParamCore = {};

/**
 * Prep function - decode ref if needed.
 */
ActionParamCore.PARAM_PREP_FUNCTIONS = {
  // Strip quotes from strings
  string: function(script, context, paramSpec, param) {
    if (param[0] === '"' && param[param.length - 1] === '"') {
      return param.slice(1, param.length - 1);
    }
    return param;
  },
  number: function(script, context, paramSpec, param) {
    return Number(param);
  },
  // Don't decode refs yet
  ref: function(script, context, paramSpec, param) {
    if (paramSpec.raw) {
      return param;
    }
    return param;
  }
};

ActionParamCore.prepareParam = function(script, context, paramSpec, param) {
  var paramPrepFunc = ActionParamCore.PARAM_PREP_FUNCTIONS[paramSpec.type];
  // If no prep function is present, return the param as-is.
  if (!paramPrepFunc) {
    return param;
  }
  return paramPrepFunc(script, context, paramSpec, param);
};

ActionParamCore.prepareParams = function(script, context, paramsSpec, params) {
  return _.mapValues(params, function(param, key) {
    var spec = paramsSpec[key];
    return ActionParamCore.prepareParam(script, context, spec, param);
  });
};

module.exports = ActionParamCore;
