const Sequelize = require('sequelize');

const config = require('../config.ts');
const models = require('../models');

class RelayEntrywayController {
  static async assignTempRelayEntryway(experience) {
    // Find the temporary entryway for this stage
    const tempEntryway = await models.RelayEntryway.findOne({
      where: { stage: config.env.HQ_STAGE, isTemporary: true },
      include: { model: models.RelayService, as: 'relayService' }
    });
    if (!tempEntryway) {
      return;
    }
    // Clear out any old relays from other experiences
    await models.Relay.destroy({
      where: {
        stage: config.env.HQ_STAGE,
        relayPhoneNumber: tempEntryway.relayService.phoneNumber,
        experienceId: { [Sequelize.Op.ne]: experience.id }
      }
    });
    // Assign the entryway to this experience
    await tempEntryway.update({
      orgId: experience.orgId,
      experienceId: experience.id
    });
  }
}

module.exports = RelayEntrywayController;
