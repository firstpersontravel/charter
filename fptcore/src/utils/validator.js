const _ = require('lodash');

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

  getComponentVariety(spec, value) {
    const componentType = spec.component;
    const componentDef = this.registry.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component type "${spec.component}".`);
    }
    return value ? value[componentDef.typeKey] : null;
  }

  /**
   * Get resource class of a component property, merging common and variety.
   */
  getComponentClass(spec, variety) {
    const componentType = spec.component;
    const componentDef = this.registry.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component type "${componentType}".`);
    }
    const componentsRegistry = this.registry[componentType];
    const typeClass = {
      properties: {
        [componentDef.typeKey]: {
          type: 'enum',
          options: Object.keys(componentsRegistry),
          required: true,
          help: `Type of ${componentType}.`,
          display: { label: false }
        }
      }
    };
    // Return type object if no existing component to allow you to choose one
    // in the interface.
    if (!variety) {
      return Object.assign({ display: { form: 'inline' } }, typeClass);
    }
    if (!componentsRegistry[variety]) {
      throw new Error(`"${variety}" is not one of the "${componentType}" components.`);
    }
    const commonClass = componentDef.common || {};
    const varietyClass = {
      properties: componentsRegistry[variety][componentDef.propertiesKey]
    };
    return _.merge({}, typeClass, commonClass, varietyClass);
  }

  /**
   * Embed a component validator which hinges on a key param.
   */
  component(script, name, spec, param) {
    const componentType = spec.component;
    const componentDef = this.registry.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component "${componentType}".`);
    }
    const variety = this.getComponentVariety(spec, param);
    if (!variety) {
      return [`Required param "${name}[${componentDef.typeKey}]" not present.`];
    }
    const componentsRegistry = this.registry[componentType];
    if (!componentsRegistry[variety]) {
      return [`"${variety}" is not one of the "${componentType}" components.`];
    }
    const componentClass = this.getComponentClass(spec, variety);
    const prefix = name + '.';
    return this.validateResource(script, componentClass, param, prefix);
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
