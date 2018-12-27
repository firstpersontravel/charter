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
    var paramWarnings = ParamValidators.validate(script, paramName, paramSpec,
      param);
    if (paramWarnings && paramWarnings.length > 0) {
      warnings.push.apply(warnings, paramWarnings);
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
