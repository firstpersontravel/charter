const database = require('../config').database;
const Experience = require('./experience');
const Org = require('./org');

const {
  belongsToField,
  booleanField,
  datetimeField,
  enumStringField,
  jsonField,
  mutableModifier,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

const ASSET_TYPE_OPTIONS = ['directions'];

/**
 * Asset model
 */
const Asset = database.define('Asset', snakeCaseColumns({
  createdAt: datetimeField(),
  updatedAt: mutableModifier(datetimeField()),
  type: enumStringField(32, ASSET_TYPE_OPTIONS),
  name: mutableModifier(requiredStringField(64)),
  data: mutableModifier(jsonField(database, 'Asset', 'data')),
  isArchived: mutableModifier(booleanField(false))
}));

Asset.belongsTo(Org, belongsToField('org'));
Asset.belongsTo(Experience, belongsToField('experience'));

module.exports = Asset;
