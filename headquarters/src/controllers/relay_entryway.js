const config = require('../config');
const models = require('../models');

class RelayEntrywayController {
  static async assignTempRelayEntryway(experience) {
    await models.RelayEntryway.update({
      orgId: experience.orgId,
      experienceId: experience.id
    }, {
      where: {
        stage: config.env.HQ_STAGE,
        isTemporary: true
      },
      limit: 1
    });
  }
}

module.exports = RelayEntrywayController;