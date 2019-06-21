const _ = require('lodash');

// TODO -- move this into the registries
const ConditionCore = require('../cores/condition');
const Validations = require('./validations');

class Validator {
  constructor(registry) {
    this.registry = registry;
  }

  dictionary(script, name, spec, param) {
    if (!spec.keys) {
      throw new Error('Invalid dictionary spec: requires keys.');
    }
    if (!spec.values) {
      throw new Error('Invalid dictionary spec: requires values.');
    }
    if (!_.isPlainObject(param)) {
      return ['Dictionary param "' + name + '" should be an object.'];
    }
    const itemWarnings = [];
    _.each(param, (value, key) => {
      // Add warnings for key
      const keyName = name + '[' + key + ']';
      itemWarnings.push.apply(itemWarnings,
        this.validateParam(script, keyName, spec.keys, key)
      );
      // Add warnings for value
      const nestedAttribute = name + '[' + key + ']';
      itemWarnings.push.apply(itemWarnings,
        this.validateParam(script, nestedAttribute, spec.values, value)
      );
    });
    return itemWarnings;
  }

  list(script, name, spec, param) {
    if (!spec.items) {
      throw new Error('Invalid list spec: requires items.');
    }
    if (!_.isArray(param)) {
      return ['List param "' + name + '" should be an array.'];
    }
    return _(param)
      .map((item, i) => (
        this.validateParam(script, `${name}[${i}]`, spec.items, item)
      ))
      .flatten()
      .value();
  }

  object(script, name, spec, param) {
    if (!spec.properties) {
      throw new Error('Invalid object spec: requires properties.');
    }
    const prefix = name + '.';
    return this.validateParams(script, spec.properties, param, prefix);
  }

  ifClause(script, name, spec, param) {
    if (!_.isPlainObject(param)) {
      return ['If param "' + name + '" should be an object.'];
    }
    return this.validateParam(script, name, ConditionCore.ifSpec, param);
  }

  /**
   * Get the variety of a param by spec.
   */
  getComponentVariety(spec, param) {
    if (!param) {
      return null;
    }
    return _.isFunction(spec.key) ? spec.key(param) : param[spec.key];
  }

  /**
   * Get resource class of a component property, merging common and variety.
   */
  getComponentClass(spec, variety) {
    const commonClass = spec.common;
    // For display in the editor, it's useful to just show the common
    // class if you have a null object, that way users can select
    // the variety to get the extra fields.
    if (!variety) {
      return commonClass;
    }
    if (!spec.classes[variety]) {
      throw new Error('Invalid variety ' + variety +
        ', should be one of: ' +
        Object.keys(spec.classes).join(', ') + '.');
    }
    const variedClass = spec.classes[variety];
    return _.merge({}, commonClass, variedClass);
  }

  /**
   * Embed a component validator which hinges on a key param.
   */
  component(script, name, spec, param) {
    if (!spec.key) {
      throw new Error('Invalid component spec: requires key.');
    }
    if (!spec.classes) {
      throw new Error('Invalid component spec: requires classes.');
    }
    if (!_.isFunction(spec.key)) {
      if (!_.isPlainObject(param)) {
        return ['Component param "' + name + '" should be an object.'];
      }
    }
    // HACK TO SUPPORT FUNCTION KEYS FOR NOW UNTIL WE SIMPLIFY THE EVENT
    // STRUCTURE -- should be {type: event_type, ...params}.
    const keyName = _.isFunction(spec.key) ? 'key' : spec.key;
    const variety = this.getComponentVariety(spec, param);
    if (!variety) {
      return ['Required param "' + name + '[' + keyName + ']" not present.'];
    }
    if (!_.isString(variety)) {
      return ['Component param "' + name + '" property "' + keyName +
        '" should be a string.'];
    }
    if (!spec.classes[variety]) {
      return ['Component param "' + name + '" property "' + keyName +
        '" ("' + variety + '") should be one of: ' +
        Object.keys(spec.classes).join(', ') + '.'];
    }
    const varietyClass = this.getComponentClass(spec, variety);
    const prefix = name + '.';
    return this.validateResource(script, varietyClass, param, prefix);
  }

  /**
   * Get param type from the spec and validate a param against it.
   */
  validateParam(script, name, spec, param) {
    if (!spec.type) {
      throw new Error('Missing param type in spec "' + name + '".');
    }
    const paramValidator = Validations[spec.type] || this[spec.type];
    if (!paramValidator) {
      throw new Error('Invalid param type "' + spec.type + '".');
    }
    return paramValidator.call(this, script, name, spec, param) || [];
  }

  /**
   * Validate an entry in a params object.
   */
  validateParamEntry(script, paramSpec, param, paramNameWithPrefix) {
    if (!paramSpec) {
      throw new Error(`Empty param spec for param "${paramNameWithPrefix}".`);
    }

    if (_.isUndefined(param)) {
      // Required params must be present.
      if (paramSpec.required) {
        return ['Required param "' + paramNameWithPrefix + '" not present.'];
      }
      // Otherwise skip validation on empty entries.
      return [];
    }

    return this.validateParam(script, paramNameWithPrefix, paramSpec, param);
  }

  /**
   * Validate a list of params against a spec.
   */
  validateParams(script, paramsSpec, params, prefix) {
    const warnings = [];

    // If you only have a 'self' parameter, then apply the parameter checking
    // passing through the object. Otherwise require an object and do parameter
    // checking on each key/value pair.
    if (!_.isPlainObject(params)) {
      return ['Parameters should be an object.'];
    }

    // Check for required params and do individual parameter validation.
    for (const paramName of Object.keys(paramsSpec)) {
      const paramSpec = paramsSpec[paramName];
      const param = params[paramName];
      const paramNameWithPrefix = prefix + paramName;
      warnings.push(...this.validateParamEntry(script, paramSpec, param, 
        paramNameWithPrefix));
    }

    // Check for unexpected params -- events sometimes have string paramss,
    // like in `{ event: { cue: CUE-NAME } }`.
    for (const paramName of Object.keys(params)) {
      const paramNameWithPrefix = prefix + paramName;
      if (!paramsSpec[paramName]) {
        warnings.push(
          'Unexpected param "' + paramNameWithPrefix +
          '" (expected one of: ' + Object.keys(paramsSpec).join(', ') + ').'
        );
      }
    }

    // Return gathered warnings
    return warnings;
  }

  /**
   * Validate a whole resource definition.
   */
  validateResource(script, resourceClass, resource, prefix) {
    if (!resourceClass.properties) {
      throw new Error('Invalid resource: expected properties.');
    }
    const warnings = this.validateParams(script, resourceClass.properties,
      resource, prefix || '');
    if (resourceClass.validateResource) {
      warnings.push(...resourceClass.validateResource(script, resource) || []);
    }
    return warnings;
  }
}

module.exports = Validator;
