const database = require('../config').database;
const Trip = require('./trip');
const User = require('./user');

const {
  datetimeField,
  requiredStringField,
  optionalStringField,
  oneToMany,
  jsonField,
  snakeCaseColumns
} = require('./fields');

/**
 * Player model.
 */
const Player = database.define('Player', snakeCaseColumns({
  roleName: requiredStringField(32, false),
  currentPageName: optionalStringField(64),
  acknowledgedPageName: optionalStringField(64),
  acknowledgedPageAt: datetimeField(),
  values: jsonField(database, 'Player', 'values'),
}));

oneToMany(Player, Trip);
oneToMany(Player, User, true);

module.exports = Player;
