const moment = require('moment-timezone');

const models = require('../models');

const LEVELS = {
  debug: 0,
  info: 10,
  warn: 20,
  error: 30,
  fatal: 40
};

class LogEntryController {
  static async log(trip, level, message) {
    if (!LEVELS[level]) {
      throw new Error(`Invalid log level "${level}".`);
    }
    await models.LogEntry.create({
      orgId: trip.orgId,
      tripId: trip.id,
      createdAt: moment.utc(),
      level: LEVELS[level],
      message: message
    });
  }
}

module.exports = LogEntryController;