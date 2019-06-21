const _ = require('lodash');
const jsonschema = require('jsonschema');

// const ConditionCore = require('./condition');
const TextUtil = require('../utils/text');
const ResourcesRegistry = require('../registries/resources');
const ValidationCore = require('../cores/validation');
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

function walkObjectParam(parent, key, obj, paramSpec, paramType, iteree) {
  if (!paramSpec.type) {
    throw new Error('Param spec with no type.');
  }
  if (paramSpec.type === 'variegated') {
    const variety = ValidationCore.getVariegatedVariety(paramSpec, obj);
    const varietyClass = ValidationCore.getVariegatedClass(paramSpec, variety);
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

  // Wait on this until conditionals are turned into a first-order obj type
  // For if clauses, call iteree for all if clauses, both parent and child
  // if (paramSpec.type === 'ifClause') {
  //   if (paramType === 'ifClause') {
  //     iteree(obj, paramSpec, parent, key);
  //   }
  //   walkObjectParam(parent, key, obj, ConditionCore.ifSpec, 'ifClause',
  //     iteree);
  // }

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
    if (paramName === 'self') {
      walkObjectParam(parent, key, obj, spec[paramName], paramType, iteree);
      return;
    }
    walkObjectParam(obj, paramName, obj[paramName], spec[paramName], paramType,
      iteree);
  }
}

class ScriptCore {
  /**
   * Walk over all params in a resource.
   */
  static walkResourceParams(resourceType, resource, paramType, iteree) {
    const resourceClass = ResourcesRegistry[resourceType];
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
    const resourceClass = ResourcesRegistry[resourceType];
    if (!resourceClass) {
      return [{
        path: collectionName,
        collection: collectionName,
        message: 'Invalid collection: ' + collectionName
      }];
    }
    const errors = ValidationCore.validateResource(script, resourceClass, 
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
