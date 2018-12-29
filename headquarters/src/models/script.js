const _ = require('lodash');
const { NOW, INTEGER, ValidationError } = require('sequelize');

const { TextUtil, ParamValidators, ResourcesRegistry } = require('fptcore');

const database = require('../config').database;

const {
  datetimeField,
  booleanField,
  requiredStringField,
  optionalStringField,
  jsonField,
  snakeCaseColumns
} = require('./fields');

function getResourceErrors(script, collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceName = resource.name || '<unknown>';
  const resourceClass = ResourcesRegistry[resourceType];
  if (!resourceClass) {
    return [{
      path: `content.${collectionName}`,
      collection: collectionName,
      message: `Invalid collection: ${collectionName}.`
    }];
  }
  const errors = ParamValidators.validateResource(script, resourceClass, 
    resource);

  return errors.map(error => ({
    path: `${collectionName}[name=${resourceName}]`,
    collection: collectionName,
    message: error
  }));
}

function validateScriptContent(script) {
  var errors = [];
  for (const collectionName of Object.keys(script.content)) {
    const collection = script.content[collectionName];
    if (!_.isArray(collection)) {
      errors.push({
        path: `content.${collectionName}`,
        collection: collectionName,
        message: `Collection must be an array: ${collectionName}.`
      });
      continue;
    }
    for (const resource of collection) {
      const resourceErrors = getResourceErrors(script, collectionName,
        resource);
      errors.push.apply(errors, resourceErrors);
    }
  }
  if (errors.length > 0) {
    const collectionNames = _.uniq(_.map(errors, 'collection'));
    const onlyOne = errors.length === 1;
    const message = `There ${onlyOne ? 'was' : 'were'} ${errors.length} error${onlyOne ? '' : 's'} validating the following collections: ${collectionNames.join(', ')}.`;
    throw new ValidationError(message, errors);
  }
}

/**
 * Script model.
 */
const Script = database.define('Script', snakeCaseColumns({
  createdAt: Object.assign(datetimeField(), { defaultValue: NOW }),
  name: requiredStringField(255),
  title: requiredStringField(255),
  host: optionalStringField(64),
  timezone: requiredStringField(32),
  version: INTEGER,
  content: jsonField(database, 'Script', 'content', {
    extraValidate: {
      resources: (value) => {
        if (_.isString(value)) {
          try {
            // We're parsing JSON twice this means. *shrug*
            value = JSON.parse(value);
          } catch (err) {
            // Pass, since the error will be caught elsewhere.
          }
        }
        // Don't check if it's not an object cos that overlaps with the string
        // case where you get a string.
        if (_.isObject(value)) {
          validateScriptContent({ content: value });
        }
      }
    }
  }),
  isActive: booleanField(false),
  isArchived: booleanField(false)
}));

module.exports = Script;
