const jsonschema = require('jsonschema');

const TextUtil = require('../utils/text');
const coreRegistry = require('../core-registry');
const Validator = require('../utils/validator');
const Walker = require('../utils/walker');
const Errors = require('../errors');

const CURRENT_VERSION = 44;

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
  static CURRENT_VERSION = CURRENT_VERSION;

  static getResourceErrors(scriptContent: any, collectionName: string, resource: any): any[] {
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

    return errors.map((err: string) => ({
      path: `${collectionName}[name=${resourceName}]`,
      collection: collectionName,
      message: err
    }));
  }

  static validateCollection(scriptContent: any, collectionName: string): any[] {
    const collection = scriptContent[collectionName];
    const errors: any[] = [];
    const names = new Set();

    // Check is array
    if (!Array.isArray(collection)) {
      errors.push({
        path: collectionName,
        collection: collectionName,
        message: 'Collection must be an array: ' + collectionName + '.'
      });
      return errors;
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

  static validateComponents(scriptContent: any, componentType: string): any[] {
    const validateUniqueNames: Record<string, string> = {
      actions: 'id',
      panels: 'id'
    };
    const validateUniqueParam = validateUniqueNames[componentType];
    if (!validateUniqueParam) {
      return [];
    }
    const errors: any[] = [];
    const names = new Set();
    walker.walkAllFields(scriptContent, componentType,
      (collectionName: string, resource: any, obj: any, spec: any) => {
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

  static validateScriptContent(scriptContent: any): void {
    // Check meta block
    const metaValidator = new jsonschema.Validator();
    const metaResult = metaValidator.validate(scriptContent.meta || null, metaSchema);
    if (!metaResult.valid) {
      const metaErrors = metaResult.errors.map(function(e: any) {
        return {
          message: e.property + ' ' + e.message,
          path: 'meta',
          collection: 'meta'
        };
      });
      throw new Errors.ScriptValidationError('Invalid meta resource.',
        metaErrors);
    }

    // Check resources
    const errors: any[] = [];
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
      const collectionNames = [...new Set(errors.map((e: any) => e.collection))];
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

module.exports = ScriptCore;

export {};
