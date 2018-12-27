var _ = require('lodash');

var ParamValidators = require('../utils/param_validators');

var SpecValidationCore = {};

/**
 * Check any object against a param spec and get warnings.
 */
SpecValidationCore.getWarnings = function(script, paramsSpec, item) {
  var warnings = [];
  // Check for required params and do individual parameter validation.
  Object.keys(paramsSpec).forEach(function(paramName) {
    var paramSpec = paramsSpec[paramName];
    var param = paramName === 'self' ? item : item[paramName];
    if (_.isUndefined(param)) {
      if (paramSpec.required) {
        warnings.push('Required param "' + paramName + '" not present.');
      }
      return;
    }
    var paramValidator = ParamValidators[paramSpec.type];
    if (!paramValidator) {
      throw new Error('Invalid param type "' + paramSpec.type + '".');
    }
    var paramWarning = paramValidator(script, paramName, paramSpec, param);
    if (paramWarning) {
      warnings.push(paramWarning);
    }
  });
  // Check for unexpected params -- events sometimes have string items,
  // like in `{ event: { cue: CUE-NAME } }`.
  if (_.isObject(item)) {
    Object.keys(item).forEach(function(paramName) {
      if (!paramsSpec[paramName]) {
        warnings.push('Unexpected param "' + paramName + '".');
      }
    });
  }
  // Return gathered warnings
  return warnings;
};

module.exports = SpecValidationCore;
