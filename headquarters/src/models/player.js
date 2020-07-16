const database = require('../config').database;

const Org = require('./org');
const Trip = require('./trip');
const Participant = require('./participant');

const {
  allowNullModifier,
  belongsToField,
  datetimeField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Player model.
 */
const Player = database.define('Player', snakeCaseColumns({
  roleName: requiredStringField(32),
  acknowledgedPageName: mutableModifier(optionalStringField(64)),
  acknowledgedPageAt: mutableModifier(allowNullModifier(datetimeField()))
}));

Player.belongsTo(Org, belongsToField('org'));
Player.belongsTo(Trip, belongsToField('trip'));
Player.belongsTo(Participant, mutableModifier(allowNullModifier(
  belongsToField('participant'))));

module.exports = Player;
