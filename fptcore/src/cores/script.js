var _ = require('lodash');
var jsonschema = require('jsonschema');

var TextUtil = require('../utils/text');
var ResourcesRegistry = require('../registries/resources');
var ParamValidators = require('../utils/param_validators');
var Errors = require('../errors');

var CURRENT_VERSION = 10;

var metaSchema = {
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
    var variety = ParamValidators.getVariegatedVariety(paramSpec, obj);
    var varietyClass = ParamValidators.getVariegatedClass(paramSpec, variety);
    walkObjectParams(parent, key, obj, varietyClass.properties, paramType,
      iteree);
    return;
  }
  if (paramSpec.type === 'subresource') {
    walkObjectParams(parent, key, obj, paramSpec.class.properties,
      paramType, iteree);
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
  Object.keys(spec).forEach(function(paramName) {
    if (paramName === 'self') {
      walkObjectParam(parent, key, obj, spec[paramName], paramType, iteree);
      return;
    }
    walkObjectParam(obj, paramName, obj[paramName], spec[paramName], paramType,
      iteree);
  });
}

class ScriptCore {
  /**
   * Walk all resources in the script to iterate over all params
   */
  static walkParams(scriptContent, paramType, iteree) {
    Object
      .keys(scriptContent)
      .forEach(function (collectionName) {
        if (collectionName === 'meta') {
          return;
        }
        var resourceType = TextUtil.singularize(collectionName);
        var resourceClass = ResourcesRegistry[resourceType];
        var collection = scriptContent[collectionName];
        collection.forEach(function(resource) {
          walkObjectParams(null, null, resource, resourceClass.properties, 
            paramType, iteree);
        });
      });
  }

  static getResourceErrors(script, collectionName, resource) {
    var resourceType = TextUtil.singularize(collectionName);
    var resourceName = resource.name || '<unknown>';
    var resourceClass = ResourcesRegistry[resourceType];
    if (!resourceClass) {
      return [{
        path: collectionName,
        collection: collectionName,
        message: 'Invalid collection: ' + collectionName
      }];
    }
    var errors = ParamValidators.validateResource(script, resourceClass, 
      resource);

    return errors.map(function(err) {
      return {
        path: collectionName + '[name=' + resourceName + ']',
        collection: collectionName,
        message: err
      };
    });
  }

  static validateScriptContent(script) {
    // Check meta block
    var metaValidator = new jsonschema.Validator();
    var metaOptions = { propertyName: 'meta' };
    var metaResult = metaValidator.validate(script.content.meta || null,
      metaSchema, metaOptions);
    if (!metaResult.valid) {
      var metaErrors = metaResult.errors.map(function(e) {
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
    var errors = [];
    Object.keys(script.content).forEach(function(collectionName) {
      if (collectionName === 'meta') {
        return;
      }
      var collection = script.content[collectionName];
      if (!_.isArray(collection)) {
        errors.push({
          path: collectionName,
          collection: collectionName,
          message: 'Collection must be an array: ' + collectionName + '.'
        });
        return;
      }
      collection.forEach(function(resource) {
        var resourceErrors = ScriptCore.getResourceErrors(script, collectionName,
          resource);
        errors.push.apply(errors, resourceErrors);
      });
    });
    if (errors.length > 0) {
      var collectionNames = _.uniq(_.map(errors, 'collection'));
      var onlyOne = errors.length === 1;
      var message = (
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
