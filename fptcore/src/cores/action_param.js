const _ = require('lodash');

/**
 * Prep function - decode ref if needed.
 */
const PARAM_PREP_FUNCTIONS = {
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

class ActionParamCore {
  /**
   * Prepare a parameter.
   */
  static prepareParam(paramSpec, param, actionContext) {
    const paramPrepFunc = PARAM_PREP_FUNCTIONS[paramSpec.type];
    // If no prep function is present, return the param as-is.
    if (!paramPrepFunc) {
      return param;
    }
    return paramPrepFunc(paramSpec, param, actionContext);
  }

  /**
   * Prepare all parameters.
   */
  static prepareParams(paramsSpec, params, actionContext) {
    return _.mapValues(params, (param, key) => {
      if (!paramsSpec[key]) {
        throw new Error('Invalid param ' + key);
      }
      const spec = paramsSpec[key];
      return this.prepareParam(spec, param, actionContext);
    });
  }
}

module.exports = ActionParamCore;
