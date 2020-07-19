const database = require('../config').database;

const {
  allowNullModifier,
  booleanField,
  datetimeField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * User model.
 */
const User = database.define('User', snakeCaseColumns({
  createdAt: datetimeField(),
  email: mutableModifier(requiredStringField(255)),
  passwordHash: mutableModifier(requiredStringField(60)),
  passwordResetToken: mutableModifier(optionalStringField(32)),
  passwordResetExpiry: mutableModifier(allowNullModifier(datetimeField())),
  firstName: mutableModifier(optionalStringField(255)),
  lastName: mutableModifier(optionalStringField(255)),
  isArchived: mutableModifier(booleanField(false))
}));

module.exports = User;
