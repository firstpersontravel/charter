const _ = require('lodash');
const jsonschema = require('jsonschema');

const TextUtil = require('../utils/text');
const coreRegistry = require('../core-registry');
const Validator = require('../utils/validator');
const Walker = require('../utils/walker');
const Errors = require('../errors');

const CURRENT_VERSION = 40;

const metaSchema = {
  type: 'object',
  properties: {
    version: { type: 'integer', enum: [CURRENT_VERSION] }
  },
  required: ['version'],
  additionalProperties: false
};

const validator = new Validator(coreRegistry);
const walker = new Walker(coreRegistry);

class ScriptCore {
  static getResourceErrors(scriptContent, collectionName, resource) {
    const resourceType = TextUtil.singularize(collectionName);
    const resourceName = resource.name || '<unknown>';
    const resourceClass = coreRegistry.resources[resourceType];
    if (!resourceClass) {
      return [{
        path: collectionName,
        collection: collectionName,
        message: 'Invalid collection: ' + collectionName
      }];
    }
    const errors = validator.validateResource(scriptContent, resourceClass, 
      resource);

    return errors.map(err => ({
      path: `${collectionName}[name=${resourceName}]`,
      collection: collectionName,
      message: err
    }));
  }

  static validateCollection(scriptContent, collectionName) {
    const collection = scriptContent[collectionName];
    const errors = [];
    const names = new Set();

    // Check is array
    if (!_.isArray(collection)) {
      errors.push({
        path: collectionName,
        collection: collectionName,
        message: 'Collection must be an array: ' + collectionName + '.'
      });
      return;
    }

    // Check each resource
    for (const resource of collection) {
      // Check for duplicate names
      if (names.has(resource.name)) {
        errors.push({
          path: collectionName,
          collection: collectionName,
          message: `Duplicate names: ${resource.name}`
        });
      }

      // Get errors
      const resourceErrors = ScriptCore.getResourceErrors(scriptContent, collectionName, resource);
      errors.push(...resourceErrors);
      names.add(resource.name);
    }

    return errors;
  }

  static validateComponents(scriptContent, componentType) {
    const validateUniqueNames = {
      actions: 'id',
      panels: 'id'
    };
    const validateUniqueParam = validateUniqueNames[componentType];
    if (!validateUniqueParam) {
      return [];
    }
    const errors = [];
    const names = new Set();
    walker.walkAllFields(scriptContent, componentType,
      (collectionName, resource, obj, spec) => {
        // Check no overlapping names for any components with a name type
        if (!obj[validateUniqueParam]) {
          return;
        }
        if (names.has(obj[validateUniqueParam])) {
          errors.push({
            path: `${collectionName}[name=${resource.name}]`,
            collection: collectionName,
            message:
              `Duplicate id in ${componentType}: ${obj[validateUniqueParam]}`
          });
        }
        names.add(obj[validateUniqueParam]);
      });
    return errors;
  }

  static validateScriptContent(scriptContent) {
    // Check meta block
    const metaValidator = new jsonschema.Validator();
    const metaOptions = { propertyName: 'meta' };
    const metaResult = metaValidator.validate(scriptContent.meta || null,
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
    for (const collectionName of Object.keys(scriptContent)) {
      if (collectionName === 'meta') {
        continue;
      }
      errors.push(...this.validateCollection(scriptContent, collectionName));
    }

    // Check components
    for (const componentType of Object.keys(coreRegistry.components)) {
      errors.push(...this.validateComponents(scriptContent, componentType));
    }

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
