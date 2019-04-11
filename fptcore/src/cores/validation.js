const _ = require('lodash');

const ConditionCore = require('../cores/condition');
const TimeUtil = require('../utils/time');

class ValidationCore {
  static string(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['String param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['String param "' + name + '" should not be blank.'];
    }
  }

  static email(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Email param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['Email param "' + name + '" should not be blank.'];
    }
    const emailRegex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+\.[^>]+)>?)/;
    if (!emailRegex.test(param)) {
      return ['Email param "' + name + '" should be a valid email.'];
    }
  }

  static markdown(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Markdown param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['Markdown param "' + name + '" should not be blank.'];
    }
  }

  static simpleValue(script, name, spec, param) {
    if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
      return [
        'Simple param "' + name + '" should be a string, number or boolean.'
      ];
    }
    if (spec.required && _.isString(param) && param === '') {
      return ['Simple param "' + name + '" should not be blank.'];
    }
  }

  static number(script, name, spec, param) {
    if (isNaN(Number(param))) {
      return ['Number param "' + name + '" should be a number.'];
    }
  }

  static boolean(script, name, spec, param) {
    if (param !== true && param !== false) {
      return ['Boolean param "' + name + '" ("' + param + '") should be true or false.'];
    }
  }

  static enum(script, name, spec, param) {
    if (!spec.options) {
      throw new Error('Invalid enum spec: missing options.');
    }
    if (!_.includes(spec.options, param)) {
      return [
        'Enum param "' + name + '" is not one of ' +
        spec.options.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
      ];
    }
  }

  static timeOffset(script, name, spec, param) {
    if (!TimeUtil.timeOffsetRegex.test(param)) {
      return ['Time offset param "' + name + '" ("' + param + '") should be a number suffixed by "h/m/s".'];
    }
  }

  static name(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Name param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!/[a-zA-Z]/.test(param[0])) {
      return ['Name param "' + name + '" ("' + param + '") should start with a letter.'];
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
      return ['Name param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
    }
  }

  static media(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Media param "' + name + '" should be a string.'];
    }
    if (spec.required && !param) {
      return ['Media param "' + name + '" should not be blank.'];
    }
    // TODO: validate URL or media path
    if (spec.extensions) {
      const matchesExtension = _.some(spec.extensions, function(ext) {
        return _.endsWith(param, '.' + ext);
      });
      if (!matchesExtension) {
        return ['Media param "' + name + '" should have one of the following extensions: ' + spec.extensions.join(', ') + '.'];
      }
    }
  }

  static coords(script, name, spec, param) {
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
  }

  static timeShorthand(script, name, spec, param) {
    if (!TimeUtil.timeShorthandRegex.test(param)) {
      return [
        'Time shorthand param "' + name + '" ("' + param + '") must be valid.'
      ];
    }
  }

  static simpleAttribute(script, name, spec, param) {
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
  }

  static lookupable(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Lookupable param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!param) {
      return ['Lookupable attribute param "' + name + '" should not be blank.'];
    }
    if (!/^['"]?[\w\d_.-]+['"]?$/.test(param)) {
      return ['Lookupable param "' + name + '" ("' + param + '") should be alphanumeric with underscores, dashes and periods.'];
    }
  }

  static reference(script, name, spec, param) {
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
    const collectionName = spec.collection;
    const resourceNames = _.map(script.content[collectionName] || [], 'name');
    if (!_.includes(resourceNames, param)) {
      return ['Reference param "' + name + '" ("' + param + '") ' +
        'is not in collection "' + collectionName + '".'];
    }
  }

  static ifClause(script, name, spec, param) {
    if (!_.isPlainObject(param)) {
      return ['If param "' + name + '" should be an object.'];
    }
    return this.validateParam(script, name, ConditionCore.ifSpec, param);
  }

  static dictionary(script, name, spec, param) {
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

  static list(script, name, spec, param) {
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

  static object(script, name, spec, param) {
    if (!spec.properties) {
      throw new Error('Invalid object spec: requires properties.');
    }
    const prefix = name + '.';
    return this.validateParams(script, spec.properties, param, prefix);
  }

  /**
   * Embed a subresource validator
   */
  static subresource(script, name, spec, param) {
    if (!spec.class) {
      throw new Error('Invalid subresource spec: requires class.');
    }
    const prefix = name + '.';
    return this.validateResource(script, spec.class, param, prefix);
  }

  /**
   * Get the variety of a param by spec.
   */
  static getVariegatedVariety(spec, param) {
    if (!param) {
      return null;
    }
    return _.isFunction(spec.key) ? spec.key(param) : param[spec.key];
  }

  /**
   * Get resource class of a variegated property, merging common and variety.
   */
  static getVariegatedClass(spec, variety) {
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
   * Embed a variegated validator which hinges on a key param.
   */
  static variegated(script, name, spec, param) {
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
    const keyName = _.isFunction(spec.key) ? 'key' : spec.key;
    const variety = this.getVariegatedVariety(spec, param);
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
    const varietyClass = this.getVariegatedClass(spec, variety);
    const prefix = name + '.';
    return this.validateResource(script, varietyClass, param, prefix);
  }

  /**
   * Get param type from the spec and validate a param against it.
   */
  static validateParam(script, name, spec, param) {
    if (!spec.type) {
      throw new Error('Missing param type in spec "' + name + '".');
    }
    const paramValidator = this[spec.type];
    if (!paramValidator) {
      throw new Error('Invalid param type "' + spec.type + '".');
    }
    return paramValidator.call(this, script, name, spec, param) || [];
  }

  /**
   * Validate an entry in a params object.
   */
  static validateParamEntry(script, paramSpec, param, paramNameWithPrefix) {
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
  static validateParams(script, paramsSpec, params, prefix) {
    const warnings = [];

    const paramNames = Object.keys(paramsSpec);

    // If you only have a 'self' parameter, then apply the parameter checking
    // passing through the object. Otherwise require an object and do parameter
    // checking on each key/value pair.
    const isPassthrough = paramNames.length === 1 && paramNames[0] === 'self';
    if (!isPassthrough && !_.isPlainObject(params)) {
      return ['Parameters should be an object.'];
    }

    // Check for required params and do individual parameter validation.
    paramNames.forEach(paramName => {
      const paramSpec = paramsSpec[paramName];
      const param = isPassthrough ? params : params[paramName];
      const paramNameWithPrefix = isPassthrough
        ? prefix.replace(/\.$/, '')
        : prefix + paramName;
      warnings.push(...this.validateParamEntry(script, paramSpec, param, 
        paramNameWithPrefix));
    });

    // Check for unexpected params -- events sometimes have string paramss,
    // like in `{ event: { cue: CUE-NAME } }`.
    if (!isPassthrough) {
      Object.keys(params).forEach(paramName => {
        const paramNameWithPrefix = prefix + paramName;
        if (!paramsSpec[paramName]) {
          warnings.push(
            'Unexpected param "' + paramNameWithPrefix +
            '" (expected one of: ' + Object.keys(paramsSpec).join(', ') + ').'
          );
        }
      });
    }

    // Return gathered warnings
    return warnings;
  }

  /**
   * Validate a whole resource definition.
   */
  static validateResource(script, resourceClass, resource, prefix) {
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

module.exports = ValidationCore;
