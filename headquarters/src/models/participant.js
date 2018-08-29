const database = require('../config').database;
const Playthrough = require('./playthrough');
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
 * Participant model.
 */
const Participant = database.define('Participant', snakeCaseColumns({
  roleName: requiredStringField(32, false),
  currentPageName: optionalStringField(64),
  acknowledgedPageName: optionalStringField(64),
  acknowledgedPageAt: datetimeField(),
  values: jsonField(database, 'Participant', 'values'),
}));

oneToMany(Participant, Playthrough);
oneToMany(Participant, User, true);

module.exports = Participant;
