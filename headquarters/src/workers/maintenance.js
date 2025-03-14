const models = require('../models');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');

const TRIP_EXPIRATION_DAYS = 30;

class MaintenanceWorker {
  static async runMaintenance() {
    // Archive all trips that were updated more than 30 days ago
    const [numArchived] = await models.Trip.update(
      { isArchived: true },
      {
        where: {
          updatedAt: { [Sequelize.Op.lt]: moment.utc().subtract(TRIP_EXPIRATION_DAYS, 'days').toDate() },
          isArchived: false
        }
      }
    );
    console.log(`Archived ${numArchived} trips last updated more than ${TRIP_EXPIRATION_DAYS} days ago.`);
  }
}

module.exports = MaintenanceWorker;
