var _ = require('lodash');

var EvalCore = require('../cores/eval');
var TimeUtil = require('../utils/time');

var ParamValidators = {};

ParamValidators.string = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['String param "' + name + '" should be a string.'];
  }
  if (spec.required && param === '') {
    return ['String param "' + name + '" should not be blank.'];
  }
};

ParamValidators.email = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Email param "' + name + '" should be a string.'];
  }
  if (spec.required && param === '') {
    return ['Email param "' + name + '" should not be blank.'];
  }
  var emailRegex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+\.[^>]+)>?)/;
  if (!emailRegex.test(param)) {
    return ['Email param "' + name + '" should be a valid email.'];
  }
};

ParamValidators.markdown = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Markdown param "' + name + '" should be a string.'];
  }
  if (spec.required && param === '') {
    return ['Markdown param "' + name + '" should not be blank.'];
  }
};

ParamValidators.simpleValue = function(script, name, spec, param) {
  if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
    return [
      'Simple param "' + name + '" should be a string, number or boolean.'
    ];
  }
  if (spec.required && _.isString(param) && param === '') {
    return ['Simple param "' + name + '" should not be blank.'];
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
  if (!spec.options) {
    throw new Error('Invalid enum spec: missing options.');
  }
  if (!_.includes(spec.options, param)) {
    return [
      'Enum param "' + name + '" is not one of ' +
      spec.options.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
    ];
  }
};

ParamValidators.duration = function(script, name, spec, param) {
  if (TimeUtil.secondsForDurationShorthand(param) === 0) {
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
  if (spec.required && !param) {
    return ['Media param "' + name + '" should not be blank.'];
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

ParamValidators.coords = function(script, name, spec, param) {
  if (!_.isArray(param) || param.length !== 2 ||
      isNaN(Number(param[0])) || isNaN(Number(param[1]))) {
    return ['Coords param "' + name + '" should be an array of two numbers.'];
  }
  if (param[0] < -180 || param[0] > 180) {
    return ['Coords param "' + name + '[0]" should be between -180 and 180.'];
  }
  if (param[1] < -180 || param[1] > 180) {
    return ['Coords param "' + name + '[1]" should be between -180 and 180.'];
  }
};

ParamValidators.timeShorthand = function(script, name, spec, param) {
  if (!TimeUtil.timeShorthandRegex.test(param)) {
    return [
      'Time shorthand param "' + name + '" ("' + param + '") must be valid.'
    ];
  }
};

ParamValidators.simpleAttribute = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Simple attribute param "' + name + '" should be a string.'];
  }
  if (!param) {
    return ['Simple attribute param "' + name + '" should not be blank.'];
  }
  if (!/[A-Za-z]/.test(param[0])) {
    return ['Simple attribute param "' + name + '" ("' + param + '") should start with a letter.'];
  }
  if (!/^[\w\d_]*$/.test(param)) {
    return ['Simple attribute param "' + name + '" ("' + param + '") should be alphanumeric with underscores.'];
  }
};

ParamValidators.nestedAttribute = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Nested attribute param "' + name + '" should be a string.'];
  }
  if (!param) {
    return ['Nested attribute param "' + name + '" should not be blank.'];
  }
  if (!/[A-Za-z]/.test(param[0])) {
    return ['Nested attribute param "' + name + '" ("' + param + '") should start with a letter.'];
  }
  if (!/^[\w\d_.]+$/.test(param)) {
    return ['Nested attribute param "' + name + '" ("' + param + '") should be alphanumeric with underscores and periods.'];
  }
};

ParamValidators.lookupable = function(script, name, spec, param) {
  if (!_.isString(param)) {
    return ['Lookupable param "' + name + '" ("' + param + '") should be a string.'];
  }
  if (!param) {
    return ['Lookupable attribute param "' + name + '" should not be blank.'];
  }
  if (!/^['"]?[\w\d_.-]+['"]?$/.test(param)) {
    return ['Lookupable param "' + name + '" ("' + param + '") should be alphanumeric with underscores, dashes and periods.'];
  }
};

ParamValidators.reference = function(script, name, spec, param) {
  if (param === 'null' && spec.allowNull) {
    return [];
  }
  if (!_.isString(param)) {
    return ['Reference param "' + name + '" ("' + param + '") should be a string.'];
  }
  if (!param) {
    return ['Reference attribute param "' + name + '" should not be blank.'];
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

ParamValidators.ifClause = function(script, name, spec, param) {
  if (!_.isPlainObject(param)) {
    return ['If param "' + name + '" should be an object.'];
  }
  return ParamValidators.validateParam(script, name, EvalCore.ifSpec, param);
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
    var keyName = name + '[' + key + ']';
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, keyName, spec.keys, key)
    );
    // Add warnings for value
    var nestedAttribute = name + '[' + key + ']';
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, nestedAttribute, spec.values, value)
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
  _.each(param, function(item, i) {
    itemWarnings.push.apply(itemWarnings,
      ParamValidators.validateParam(script, name + '[' + i + ']',
        spec.items, item)
    );
  });
  return itemWarnings;
};

ParamValidators.object = function(script, name, spec, param) {
  if (!spec.properties) {
    throw new Error('Invalid object spec: requires properties.');
  }
  var prefix = name + '.';
  return ParamValidators.validateParams(script, spec.properties, param,
    prefix);
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
 * Get the variety of a param by spec.
 */
ParamValidators.getVariegatedVariety = function(spec, param) {
  return _.isFunction(spec.key) ? spec.key(param) : param[spec.key];
};

/**
 * Get resource class of a variegated property, merging common and variety.
 */
ParamValidators.getVariegatedClass = function(spec, variety) {
  var commonClass = spec.common;
  var variedClass = spec.classes[variety];
  return _.merge({}, commonClass, variedClass);
};

/**
 * Embed a variegated validator which hinges on a key param.
 */
ParamValidators.variegated = function(script, name, spec, param) {
  if (!spec.key) {
    throw new Error('Invalid variegated spec: requires key.');
  }
  if (!spec.classes) {
    throw new Error('Invalid variegated spec: requires classes.');
  }
  if (!_.isFunction(spec.key)) {
    if (!_.isPlainObject(param)) {
      return ['Variegated param "' + name + '" should be an object.'];
    }
  }
  // HACK TO SUPPORT FUNCTION KEYS FOR NOW UNTIL WE SIMPLIFY THE EVENT
  // STRUCTURE -- should be {type: event_type, ...params}.
  var keyName = _.isFunction(spec.key) ? 'key' : spec.key;
  var variety = ParamValidators.getVariegatedVariety(spec, param);
  if (!variety) {
    return ['Required param "' + name + '[' + keyName + ']" not present.'];
  }
  if (!_.isString(variety)) {
    return ['Variegated param "' + name + '" property "' + keyName +
      '" should be a string.'];
  }
  if (!spec.classes[variety]) {
    return ['Variegated param "' + name + '" property "' + keyName +
      '" ("' + variety + '") should be one of: ' +
      Object.keys(spec.classes).join(', ') + '.'];
  }
  var varietyClass = ParamValidators.getVariegatedClass(spec, variety);
  var prefix = name + '.';
  return ParamValidators.validateResource(script, varietyClass, param, prefix);
};

/**
 * Get param type from the spec and validate a param against it.
 */
ParamValidators.validateParam = function(script, name, spec, param) {
  if (!spec.type) {
    throw new Error('Missing param type in spec "' + name + '".');
  }
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

  var paramNames = Object.keys(paramsSpec);
  // If you only have a 'self' parameter, then apply the parameter checking
  // passing through the object. Otherwise require an object and do parameter
  // checking on each key/value pair.
  var isPassthrough = paramNames.length === 1 && paramNames[0] === 'self';
  if (!isPassthrough && !_.isPlainObject(params)) {
    return ['Parameters should be an object.'];
  }

  // Check for required params and do individual parameter validation.
  paramNames.forEach(function(paramName) {
    var paramSpec = paramsSpec[paramName];
    var param = isPassthrough ? params : params[paramName];
    var paramNameWithPrefix = isPassthrough
      ? prefix.replace(/\.$/, '')
      : prefix + paramName;
    if (!paramSpec) {
      throw new Error('Empty param spec for param "' + paramNameWithPrefix + '".');
    }
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
  if (!isPassthrough) {
    Object.keys(params).forEach(function(paramName) {
      var paramNameWithPrefix = prefix + paramName;
      if (!paramsSpec[paramName]) {
        warnings.push('Unexpected param "' + paramNameWithPrefix + '" (expected one of: ' + Object.keys(paramsSpec).join(', ') + ').');
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
  if (!resourceClass.properties) {
    throw new Error('Invalid resource: expected properties.');
  }
  var warnings = ParamValidators.validateParams(script,
    resourceClass.properties, resource, prefix || '');
  if (resourceClass.validateResource) {
    var resourceWarnings = resourceClass.validateResource(script, resource);
    warnings.push.apply(warnings, resourceWarnings);
  }
  return warnings;
};


module.exports = ParamValidators;
