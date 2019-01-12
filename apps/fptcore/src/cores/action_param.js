var _ = require('lodash');

var ActionParamCore = {};

/**
 * Prep function - decode ref if needed.
 */
ActionParamCore.PARAM_PREP_FUNCTIONS = {
  // Strip quotes from strings
  string: function(paramSpec, param, actionContext) {
    if (param[0] === '"' && param[param.length - 1] === '"') {
      return param.slice(1, param.length - 1);
    }
    return param;
  },
  number: function(paramSpec, param, actionContext) {
    return Number(param);
  },
  // Don't decode refs yet
  ref: function(paramSpec, param, actionContext) {
    if (paramSpec.raw) {
      return param;
    }
    return param;
  }
};

ActionParamCore.prepareParam = function(paramSpec, param, actionContext) {
  var paramPrepFunc = ActionParamCore.PARAM_PREP_FUNCTIONS[paramSpec.type];
  // If no prep function is present, return the param as-is.
  if (!paramPrepFunc) {
    return param;
  }
  return paramPrepFunc(paramSpec, param, actionContext);
};

ActionParamCore.prepareParams = function(paramsSpec, params, actionContext) {
  return _.mapValues(params, function(param, key) {
    if (!paramsSpec[key]) {
      throw new Error('Invalid param ' + key);
    }
    var spec = paramsSpec[key];
    return ActionParamCore.prepareParam(spec, param, actionContext);
  });
};

module.exports = ActionParamCore;
