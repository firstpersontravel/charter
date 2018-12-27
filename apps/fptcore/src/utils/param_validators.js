var _ = require('lodash');

var TimeCore = require('../cores/time');

var ParamValidators = {};

ParamValidators.string = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['String param "' + name + '" should be a string.'];
  }
  return [];
};

ParamValidators.simple = function(script, name, spec, param) {
  if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
    return [
      'Simple param "' + name + '" should be a string, number or boolean.'
    ];
  }
  return [];
};

ParamValidators.ifstring = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Ifstring param "' + name + '" should be a string.'];
  }
  // TODO SHOULD DO MORE VALIDATION HERE
  return [];
};

ParamValidators.ref = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Ref param "' + name + '" should be a string.'];
  }
  if (!/^['"]?[\w\d_.]+['"]?$/.test(param)) {
    return ['Ref param "' + name + '" should be alphanumeric with periods.'];
  }
  return [];
};

ParamValidators.number = function(script, name, spec, param) {
  if (isNaN(Number(param))) {
    return ['Number param "' + name + '" should be a number.'];
  }
  return [];
};

ParamValidators.boolean = function(script, name, spec, param) {
  if (param !== true && param !== false) {
    return ['Boolean param "' + name + '" ("' + param + '") should be true or false.'];
  }
  return [];
};

ParamValidators.enum = function(script, name, spec, param) {
  if (!_.includes(spec.values, param)) {
    return [
      'Enum param "' + name + '" is not one of ' +
      spec.values.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
    ];
  }
  return [];
};

ParamValidators.duration = function(script, name, spec, param) {
  if (TimeCore.secondsForDurationShorthand(param) === 0) {
    return ['Duration param "' + name + '" ("' + param + '") should be a number with "h", "m", or "s".'];
  }
  return [];
};

ParamValidators.name = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Name param "' + name + '" ("' + param + '") should be a string.'];
  }
  if (!/[a-zA-Z]/.test(param[0])) {
    return ['Name param "' + name + '" ("' + param + '") should start with a letter.'];
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return ['Name param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
  }
  return [];
};

ParamValidators.resource = function(script, name, spec, param) {
  if (spec.collection === 'pages' && param === 'null') {
    return [];
  }
  if (!_.isString(param)) {
    return ['Resource param "' + name + '" ("' + param + '") should be a string.'];
  }
  if (!/[a-zA-Z]/.test(param[0])) {
    return ['Resource param "' + name + '" ("' + param + '") should start with a letter.'];
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return ['Resource param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
  }
  var collectionName = spec.collection;
  var resourceNames = _.map(script.content[collectionName] || [], 'name');
  if (!_.includes(resourceNames, param)) {
    return ['Resource param "' + name + '" ("' + param + '") ' +
      'is not in collection "' + collectionName + '".'];
  }
  return [];
};

ParamValidators.dictionary = function(script, name, spec, param) {
  if (!spec.keys) {
    throw new Error('Invalid dictionary spec: requires keys.');
  }
  if (!spec.values) {
    throw new Error('Invalid dictionary spec: requires values.');
  }
  if (!_.isPlainObject(param)) {
    return ['Dictionary param "' + name + '" should be an object.'];
  }
  var itemWarnings = [];
  _.each(param, function(value, key) {
    // Add warnings for key
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validate(script, name + ' key', spec.keys, key)
    );
    // Add warnings for value
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validate(script, name + ' value', spec.values, value)
    );
  });
  return itemWarnings;
};

/**
 * Get param type from the spec and validate a param against it.
 */
ParamValidators.validate = function(script, name, spec, param) {
  var paramValidator = ParamValidators[spec.type];
  if (!paramValidator) {
    throw new Error('Invalid param type "' + spec.type + '".');
  }
  return paramValidator(script, name, spec, param);
};

module.exports = ParamValidators;
