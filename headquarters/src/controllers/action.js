const moment = require('moment');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.action' });

class ActionController {
  static async scheduleAction(trip, action) {
    const now = moment.utc();
    const scheduleAt = action.scheduleAt || now;
    const scheduleAtLocal = moment(scheduleAt)
      .utc()
      .clone()
      .tz('US/Pacific')
      .format('h:mm:ssa z');
    logger.info(action.params,
      `Scheduling ${action.name} for ${scheduleAtLocal}.`);
    const fields = {
      orgId: trip.orgId,
      tripId: trip.id,
      type: 'action',
      name: action.name,
      params: action.params,
      triggerName: action.triggerName || '',
      event: action.event || null,
      createdAt: now.toDate(),
      scheduledAt: scheduleAt,
      appliedAt: null,
      failedAt: null
    };
    return await models.Action.create(fields);
  }
}

module.exports = ActionController;
