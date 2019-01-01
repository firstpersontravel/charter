const database = require('../config').database;
const Trip = require('./trip');
const User = require('./user');

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
  roleName: requiredStringField(32, false),
  currentPageName: optionalStringField(64),
  acknowledgedPageName: mutableModifier(optionalStringField(64)),
  acknowledgedPageAt: mutableModifier(allowNullModifier(datetimeField()))
}));

Player.belongsTo(Trip, belongsToField('trip'));
Player.belongsTo(User, mutableModifier(allowNullModifier(belongsToField('user'))));

module.exports = Player;
