var _ = require('lodash');

var TimeCore = require('../cores/time');

var ParamValidators = {};

ParamValidators.string = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['String param "' + name + '" should be a string.'];
  }
};

ParamValidators.simple = function(script, name, spec, param) {
  if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
    return [
      'Simple param "' + name + '" should be a string, number or boolean.'
    ];
  }
};

ParamValidators.ifstring = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Ifstring param "' + name + '" should be a string.'];
  }
  // TODO SHOULD DO MORE VALIDATION HERE
};

ParamValidators.valueName = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Value name param "' + name + '" should be a string.'];
  }
  if (!/^['"]?[\w\d_.]+['"]?$/.test(param)) {
    return ['Value name param "' + name + '" should be alphanumeric with periods.'];
  }
};

ParamValidators.number = function(script, name, spec, param) {
  if (isNaN(Number(param))) {
    return ['Number param "' + name + '" should be a number.'];
  }
};

ParamValidators.boolean = function(script, name, spec, param) {
  if (param !== true && param !== false) {
    return ['Boolean param "' + name + '" ("' + param + '") should be true or false.'];
  }
};

ParamValidators.enum = function(script, name, spec, param) {
  if (!_.includes(spec.values, param)) {
    return [
      'Enum param "' + name + '" is not one of ' +
      spec.values.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
    ];
  }
};

ParamValidators.duration = function(script, name, spec, param) {
  if (TimeCore.secondsForDurationShorthand(param) === 0) {
    return ['Duration param "' + name + '" ("' + param + '") should be a number with "h", "m", or "s".'];
  }
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
};

ParamValidators.media = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Media param "' + name + '" should be a string.'];
  }
  // TODO: validate URL or media path
  if (spec.extensions) {
    var matchesExtension = _.some(spec.extensions, function(ext) {
      return _.endsWith(param, '.' + ext);
    });
    if (!matchesExtension) {
      return ['Media param "' + name + '" should have one of the following extensions: ' + spec.extensions.join(', ') + '.'];
    }
  }
};

ParamValidators.reference = function(script, name, spec, param) {
  if (spec.collection === 'pages' && param === 'null') {
    return [];
  }
  if (!_.isString(param)) {
    return ['Reference param "' + name + '" ("' + param + '") should be a string.'];
  }
  if (!/[a-zA-Z]/.test(param[0])) {
    return ['Reference param "' + name + '" ("' + param + '") should start with a letter.'];
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return ['Reference param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
  }
  var collectionName = spec.collection;
  var resourceNames = _.map(script.content[collectionName] || [], 'name');
  if (!_.includes(resourceNames, param)) {
    return ['Reference param "' + name + '" ("' + param + '") ' +
      'is not in collection "' + collectionName + '".'];
  }
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
    var keyName = name + ' key';
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, keyName, spec.keys, key)
    );
    // Add warnings for value
    var valueName = name + ' value';
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, valueName, spec.values, value)
    );
  });
  return itemWarnings;
};

ParamValidators.list = function(script, name, spec, param) {
  if (!spec.items) {
    throw new Error('Invalid list spec: requires items.');
  }
  if (!_.isArray(param)) {
    return ['List param "' + name + '" should be an array.'];
  }
  var itemWarnings = [];
  _.each(param, function(item) {
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, name + ' item', spec.items, item)
    );
  });
  return itemWarnings;
};

/**
 * Embed a subresource validator
 */
ParamValidators.subresource = function(script, name, spec, param) {
  if (!spec.class) {
    throw new Error('Invalid subresource spec: requires class.');
  }
  var prefix = name + '.';
  return ParamValidators.validateResource(script, spec.class, param, prefix);
};

/**
 * Get param type from the spec and validate a param against it.
 */
ParamValidators.validateParam = function(script, name, spec, param) {
  var paramValidator = ParamValidators[spec.type];
  if (!paramValidator) {
    throw new Error('Invalid param type "' + spec.type + '".');
  }
  return paramValidator(script, name, spec, param);
};

/**
 * Validate a list of params against a spec.
 */
ParamValidators.validateParams = function(script, paramsSpec, params, prefix) {
  var warnings = [];
  // Check for required params and do individual parameter validation.
  Object.keys(paramsSpec).forEach(function(paramName) {
    var paramSpec = paramsSpec[paramName];
    var param = paramName === 'self' ? params : params[paramName];
    var paramNameWithPrefix = prefix + paramName;
    if (_.isUndefined(param)) {
      if (paramSpec.required) {
        warnings.push(
          'Required param "' + paramNameWithPrefix + '" not present.'
        );
      }
      return;
    }
    var paramWarnings = ParamValidators.validateParam(
      script, paramNameWithPrefix, paramSpec, param);
    if (paramWarnings && paramWarnings.length > 0) {
      warnings.push.apply(warnings, paramWarnings);
    }
  });
  // Check for unexpected params -- events sometimes have string paramss,
  // like in `{ event: { cue: CUE-NAME } }`.
  if (_.isObject(params)) {
    Object.keys(params).forEach(function(paramName) {
      var paramNameWithPrefix = prefix + paramName;
      if (!paramsSpec[paramName]) {
        warnings.push('Unexpected param "' + paramNameWithPrefix + '".');
      }
    });
  }
  // Return gathered warnings
  return warnings;
};

/**
 * Validate a whole resource definition.
 */
ParamValidators.validateResource = function(script, resourceClass, resource,
  prefix) {
  var paramsSpec = resourceClass.properties;
  if (!_.isPlainObject(resource)) {
    return ['Resource should be an object.'];
  }
  var warnings = ParamValidators.validateParams(script, paramsSpec,
    resource, prefix);
  if (resourceClass.validateResource) {
    var resourceWarnings = resourceClass.validateResource(script, resource);
    warnings.push.apply(warnings, resourceWarnings);
  }
  return warnings;
};


module.exports = ParamValidators;
