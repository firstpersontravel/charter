const TextUtil = require('./text');

class Walker {
  constructor(registry) {
    this.registry = registry;
  }

  walkParam(parent, key, obj, paramSpec, paramType, iteree) {
    if (!paramSpec.type) {
      throw new Error('Param spec with no type.');
    }
    if (paramSpec.type === 'component') {
      // If we're looking for this kind of component, call the iteree, but don't
      // return, in case this component can be recursively nested inside itself.
      if (paramType === paramSpec.component) {
        iteree(obj, paramSpec, parent, key);
      }
      // Create the compoment class and iterate over all of its params.
      const variety = this.registry.getComponentVariety(paramSpec, obj);
      const varietyClass = this.registry.getComponentClass(paramSpec,
        variety);
      this.walkParams(parent, key, obj, varietyClass.properties, paramType,
        iteree);
      return;
    }
    if (paramSpec.type === 'object') {
      this.walkParams(parent, key, obj, paramSpec.properties, paramType,
        iteree);
      return;
    }
    if (paramSpec.type === 'list') {
      if (!obj) {
        return;
      }
      obj.forEach((item, i) => {
        this.walkParam(obj, i, item, paramSpec.items, paramType, iteree);
      });
      return;
    }
    if (paramSpec.type === 'dictionary') {
      if (!obj) {
        return;
      }
      for (const key of Object.keys(obj)) {
        this.walkParam(obj, 'keys', key, paramSpec.keys, paramType, iteree);
        this.walkParam(obj, key, obj[key], paramSpec.values, paramType,
          iteree);
      }
      return;
    }
    // If we've made it to here, we're a simple type.
    if (paramSpec.type === paramType) {
      iteree(obj, paramSpec, parent, key);
    }
  }

  walkParams(parent, key, obj, spec, paramType, iteree) {
    if (!obj) {
      return;
    }
    for (const paramName of Object.keys(spec)) {
      this.walkParam(obj, paramName, obj[paramName], spec[paramName], 
        paramType, iteree);
    }
  }

  /**
   * Walk over all params in a resource.
   */
  walkResource(resourceType, resource, paramType, iteree) {
    const resourceClass = this.registry.resources[resourceType];
    if (!resourceClass) {
      return;
    }
    this.walkParams(null, null, resource, resourceClass.properties, 
      paramType, iteree);
  }

  /*
   * Walk all resources in the script to iterate over all params
   */
  walkAllFields(scriptContent, paramType, iteree) {
    for (const collectionName of Object.keys(scriptContent)) {
      if (collectionName === 'meta') {
        continue;
      }
      const collection = scriptContent[collectionName];
      const resourceType = TextUtil.singularize(collectionName);
      for (const resource of collection) {
        this.walkResource(resourceType, resource, paramType, iteree);
      }
    }
  }
}

module.exports = Walker;
