const _ = require('lodash');

const models = require('../models');
const RelaysController = require('./relays');

class ExperienceController {
  /**
   * Locate the one active script for new trips etc.
   */
  static async findActiveScript(experienceId) {
    return await models.Script.findOne({
      where: {
        experienceId: experienceId,
        isActive: true,
        isArchived: false
      },
      include: [{
        model: models.Experience,
        as: 'experience'
      }]
    });
  }

  /**
   * Create entryway relays.
   */
  static async ensureEntrywayRelays(experienceId) {
    // Get active script by name
    const experience = await models.Experience.findByPk(experienceId);
    const script = await this.findActiveScript(experience.id);

    // Create only entryway relays
    const entrywayRelaySpecs = _.filter(script.content.relays, {
      entryway: true
    });
    const entrywayRelays = [];
    for (const relaySpec of entrywayRelaySpecs) {
      const relay = await RelaysController.ensureRelay(experience.orgId, experienceId, relaySpec);
      entrywayRelays.push(relay);
    }
    return entrywayRelays.filter(Boolean);
  }
}

module.exports = ExperienceController;
