const database = require('../config').database;

const {
  booleanField,
  enumStringField,
  mutableModifier,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

const RELAY_STAGE_OPTIONS = ['test', 'development', 'staging', 'production'];

/**
 * Relay model.
 */
const RelayService = database.define('RelayService', snakeCaseColumns({
  stage: enumStringField(32, RELAY_STAGE_OPTIONS),
  title: requiredStringField(64),
  phoneNumber: requiredStringField(15),
  sid: requiredStringField(34),
  isShared: mutableModifier(booleanField(true)),
  isActive: mutableModifier(booleanField(true)),
}));

module.exports = RelayService;
