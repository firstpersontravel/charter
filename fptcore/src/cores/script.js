const _ = require('lodash');
const jsonschema = require('jsonschema');

const TextUtil = require('../utils/text');
const Registry = require('../registry/registry');
const Validator = require('../utils/validator');
const Errors = require('../errors');

const CURRENT_VERSION = 17;

const metaSchema = {
  type: 'object',
  properties: {
    version: { type: 'integer', enum: [CURRENT_VERSION] }
  },
  required: ['version'],
  additionalProperties: false
};

const validator = new Validator(Registry);

function walkObjectParam(parent, key, obj, paramSpec, paramType, iteree) {
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
    const variety = validator.getComponentVariety(paramSpec, obj);
    const varietyClass = validator.getComponentClass(paramSpec, variety);
    walkObjectParams(parent, key, obj, varietyClass.properties, paramType,
      iteree);
    return;
  }
  if (paramSpec.type === 'object') {
    walkObjectParams(parent, key, obj, paramSpec.properties, paramType,
      iteree);
    return;
  }
  if (paramSpec.type === 'list') {
    if (!obj) {
      return;
    }
    obj.forEach(function(item, i) {
      walkObjectParam(obj, i, item, paramSpec.items, paramType, iteree);
    });
    return;
  }
  if (paramSpec.type === 'dictionary') {
    if (!obj) {
      return;
    }
    Object.keys(obj).forEach(function(key) {
      walkObjectParam(obj, 'keys', key, paramSpec.keys, paramType, iteree);
      walkObjectParam(obj, key, obj[key], paramSpec.values, paramType, iteree);
    });
    return;
  }
  // If we've made it to here, we're a simple type.
  if (paramSpec.type === paramType) {
    iteree(obj, paramSpec, parent, key);
  }
}

function walkObjectParams(parent, key, obj, spec, paramType, iteree) {
  if (!obj) {
    return;
  }
  for (const paramName of Object.keys(spec)) {
    walkObjectParam(obj, paramName, obj[paramName], spec[paramName], paramType,
      iteree);
  }
}

class ScriptCore {
  /**
   * Walk over all params in a resource.
   */
  static walkResourceParams(resourceType, resource, paramType, iteree) {
    const resourceClass = Registry.resources[resourceType];
    if (!resourceClass) {
      return;
    }
    walkObjectParams(null, null, resource, resourceClass.properties, 
      paramType, iteree);
  }

  /**
   * Walk all resources in the script to iterate over all params
   */
  static walkParams(scriptContent, paramType, iteree) {
    for (const collectionName of Object.keys(scriptContent)) {
      if (collectionName === 'meta') {
        continue;
      }
      const collection = scriptContent[collectionName];
      const resourceType = TextUtil.singularize(collectionName);
      for (const resource of collection) {
        this.walkResourceParams(resourceType, resource, paramType, iteree);
      }
    }
  }

  static getResourceErrors(script, collectionName, resource) {
    const resourceType = TextUtil.singularize(collectionName);
    const resourceName = resource.name || '<unknown>';
    const resourceClass = Registry.resources[resourceType];
    if (!resourceClass) {
      return [{
        path: collectionName,
        collection: collectionName,
        message: 'Invalid collection: ' + collectionName
      }];
    }
    const errors = validator.validateResource(script, resourceClass, 
      resource);

    return errors.map(err => ({
      path: `${collectionName}[name=${resourceName}]`,
      collection: collectionName,
      message: err
    }));
  }

  static validateScriptContent(script) {
    // Check meta block
    const metaValidator = new jsonschema.Validator();
    const metaOptions = { propertyName: 'meta' };
    const metaResult = metaValidator.validate(script.content.meta || null,
      metaSchema, metaOptions);
    if (!metaResult.valid) {
      const metaErrors = metaResult.errors.map(function(e) {
        return {
          message: e.property + ' ' + e.message,
          path: e.property,
          collection: 'meta'
        };
      });
      throw new Errors.ScriptValidationError('Invalid meta resource.',
        metaErrors);
    }

    // Check resources
    const errors = [];
    Object.keys(script.content).forEach(function(collectionName) {
      if (collectionName === 'meta') {
        return;
      }
      const collection = script.content[collectionName];
      if (!_.isArray(collection)) {
        errors.push({
          path: collectionName,
          collection: collectionName,
          message: 'Collection must be an array: ' + collectionName + '.'
        });
        return;
      }
      collection.forEach(function(resource) {
        const resourceErrors = ScriptCore.getResourceErrors(script, collectionName,
          resource);
        errors.push.apply(errors, resourceErrors);
      });
    });
    if (errors.length > 0) {
      const collectionNames = _.uniq(_.map(errors, 'collection'));
      const onlyOne = errors.length === 1;
      const message = (
        'There ' +
        (onlyOne ? 'was ' : 'were ') +
        errors.length +
        ' error' + (onlyOne ? '' : 's') +
        ' validating the following collections: ' +
        collectionNames.join(', ') +
        '.'
      );
      throw new Errors.ScriptValidationError(message, errors);
    }
  }
}

ScriptCore.CURRENT_VERSION = CURRENT_VERSION;

module.exports = ScriptCore;
