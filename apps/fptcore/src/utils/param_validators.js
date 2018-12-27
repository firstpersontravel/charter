var _ = require('lodash');

var TimeCore = require('../cores/time');

var ParamValidators = {};

ParamValidators.string = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return 'String param "' + name + '" should be a string.';
  }
  return null;
};

ParamValidators.if = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return 'If param "' + name + '" should be a string.';
  }
  // TODO SHOULD DO MORE VALIDATION HERE
  return null;
};

ParamValidators.ref = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return 'Ref param "' + name + '" should be a string.';
  }
  if (!/^['"]?[\w\d_.]+['"]?$/.test(param)) {
    return 'Ref param "' + name + '" should be alphanumeric with periods.';
  }
  return null;
};

ParamValidators.number = function(script, name, spec, param) {
  if (isNaN(Number(param))) {
    return 'Number param "' + name + '" should be a number.';
  }
  return null;
};

ParamValidators.boolean = function(script, name, spec, param) {
  if (param !== true && param !== false) {
    return 'Boolean param "' + name + '" ("' + param + '") should be true or false.';
  }
  return null;
};

ParamValidators.enum = function(script, name, spec, param) {
  if (!_.includes(spec.values, param)) {
    return (
      'Enum param "' + name + '" is not one of ' +
      spec.values.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
    );
  }
  return null;
};

ParamValidators.duration = function(script, name, spec, param) {
  if (TimeCore.secondsForDurationShorthand(param) === 0) {
    return 'Duration param "' + name + '" ("' + param + '") should be a number with "h", "m", or "s".';
  }
  return null;
};

ParamValidators.name = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return 'Name param "' + name + '" ("' + param + '") should be a string.';
  }
  if (!/[a-zA-Z]/.test(param[0])) {
    return 'Name param "' + name + '" ("' + param + '") should start with a letter.';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return 'Name param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.';
  }
  return null;
};

ParamValidators.resource = function(script, name, spec, param) {
  if (param === 'null' && spec.collection === 'pages') {
    return null;
  }
  if (!_.isString(param)) {
    return 'Resource param "' + name + '" ("' + param + '") should be a string.';
  }
  if (!/[a-zA-Z]/.test(param[0])) {
    return 'Resource param "' + name + '" ("' + param + '") should start with a letter.';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return 'Resource param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.';
  }
  var collectionName = spec.collection;
  var resourceNames = _.map(script.content[collectionName] || [], 'name');
  if (!_.includes(resourceNames, param)) {
    return 'Resource param "' + name + '" ("' + param + '") ' +
      'is not in collection "' + collectionName + '".';
  }
  return null;
};

module.exports = ParamValidators;
