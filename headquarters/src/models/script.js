const _ = require('lodash');
const { ValidationError } = require('sequelize');

const { TextUtil, ParamValidators, ResourcesRegistry } = require('fptcore');

const Experience = require('./experience');
const database = require('../config').database;

const {
  belongsToField,
  booleanField,
  integerField,
  jsonField,
  mutableModifier,
  snakeCaseColumns
} = require('../sequelize/fields');

function getResourceErrors(script, collectionName, resource) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceName = resource.name || '<unknown>';
  const resourceClass = ResourcesRegistry[resourceType];
  if (!resourceClass) {
    return [{
      path: collectionName,
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
        path: collectionName,
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
  revision: integerField(),
  contentVersion: integerField(),
  content: mutableModifier(jsonField(database, 'Script', 'content', {
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
  })),
  isActive: mutableModifier(booleanField(false)),
  isArchived: mutableModifier(booleanField(false))
}));

Script.belongsTo(Experience, belongsToField('experience'));

module.exports = Script;
