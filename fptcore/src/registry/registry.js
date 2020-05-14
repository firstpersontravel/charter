const _ = require('lodash');

class Registry {
  constructor(modules, components) {
    this.modules = {};
    this.resources = {};
    this.components = components;

    for (const componentType of Object.keys(components)) {
      this[componentType] = {};
    }

    // Load modules
    for (const mod of modules) {
      for (const componentType of Object.keys(components)) {
        mod[componentType] = {};
      }
      for (const resourceType of Object.keys(mod.resources || {})) {
        const resourceDef = mod.resources[resourceType];
        for (const componentType of Object.keys(components)) {
          Object.assign(mod[componentType], resourceDef[componentType]);
          Object.assign(this[componentType], resourceDef[componentType]);
        }
        if (resourceDef.resource) {
          this.resources[resourceType] = resourceDef.resource;
        }
      }
      this.modules[mod.name] = mod;
    }
  }

  getComponentVariety(spec, value) {
    const componentType = spec.component;
    const componentDef = this.components[componentType];
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
    const componentDef = this.components[componentType];
    if (!componentDef) {
      throw new Error(`Invalid component type "${componentType}".`);
    }
    const componentsRegistry = this[componentType];
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
    if (!variety || !componentsRegistry[variety]) {
      return Object.assign({ display: { form: 'inline' } }, typeClass);
    }
    
    const commonClass = componentDef.common || {};
    // For component class, rename `params` / `specParams` to `properties`.
    // TODO: all components should just use `properties` as a name.
    const varietyClass = Object.assign({
      properties: componentsRegistry[variety][componentDef.propertiesKey]
    }, _.omit(componentsRegistry[variety], componentDef.propertiesKey));
    const componentClass = _.merge({}, typeClass, commonClass, varietyClass);
    return componentClass;
  }
}

module.exports = Registry;
