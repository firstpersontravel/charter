const _ = require('lodash');
const { ValidationError } = require('sequelize');

const Errors = require('../../../fptcore/src/errors');
const ScriptCore = require('../../../fptcore/src/cores/script');

const Experience = require('./experience');
const Org = require('./org');
const database = require('../config').database;

const {
  belongsToField,
  booleanField,
  datetimeField,
  integerField,
  jsonField,
  mutableModifier,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Script model.
 */
const Script = database.define('Script', snakeCaseColumns({
  createdAt: datetimeField(),
  updatedAt: mutableModifier(datetimeField()),
  revision: integerField(),
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
          try {
            ScriptCore.validateScriptContent({ content: value });
          } catch (err) {
            if (err instanceof Errors.ScriptValidationError) {
              throw new ValidationError(err.message, err.fieldErrors);
            } else {
              throw err;
            }
          }
        }
      }
    }
  })),
  isActive: mutableModifier(booleanField(false)),
  isLocked: mutableModifier(booleanField(false)),
  isArchived: mutableModifier(booleanField(false))
}));

Script.belongsTo(Org, belongsToField('org'));
Script.belongsTo(Experience, belongsToField('experience'));

module.exports = Script;
