var _ = require('lodash');
var jsonschema = require('jsonschema');

var TextUtil = require('../utils/text');
var ResourcesRegistry = require('../registries/resources');
var ParamValidators = require('../utils/param_validators');
var Errors = require('../errors');

var CURRENT_VERSION = 2;

var ScriptCore = {};

var metaSchema = {
  type: 'object',
  properties: {
    version: { type: 'integer', enum: [CURRENT_VERSION] }
  },
  required: ['version'],
  additionalProperties: false
};

ScriptCore.CURRENT_VERSION = CURRENT_VERSION;

ScriptCore.getResourceErrors = function(script, collectionName, resource) {
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
};

ScriptCore.validateScriptContent = function(script) {
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
};

module.exports = ScriptCore;
