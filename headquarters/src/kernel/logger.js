const moment = require('moment');

const models = require('../models');

const LEVELS = {
  debug: 0,
  info: 10,
  warn: 20,
  error: 30,
  fatal: 40
};

class KernelLogger {
  static async debug(trip, message) {
    await this.log(trip, 'debug', message);
  }

  static async info(trip, message) {
    await this.log(trip, 'info', message);
  }

  static async warn(trip, message) {
    await this.log(trip, 'warn', message);
  }

  static async error(trip, message) {
    await this.log(trip, 'error', message);
  }

  static async fatal(trip, message) {
    await this.log(trip, 'fatal', message);
  }

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

module.exports = KernelLogger;
