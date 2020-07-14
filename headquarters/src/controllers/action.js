const moment = require('moment');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.action' });

class ActionController {
  static async scheduleAction(trip, action, playerId) {
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
      // TODO: add playerId to scheduled actions, or params?? should this just be a serialized blob?
      // playerId: playerId,
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
