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
   * Create trailhead relays.
   */
  static async ensureTrailheads(experienceId) {
    // Get active script by name
    const experience = await models.Experience.findByPk(experienceId);
    const script = await this.findActiveScript(experience.id);

    // Create only trailhead relays
    const trailheadRelaySpecs = _.filter(script.content.relays, {
      trailhead: true
    });
    const trailheadRelays = [];
    for (const relaySpec of trailheadRelaySpecs) {
      const relay = await RelaysController.ensureRelay(experience.orgId,
        experienceId, null, relaySpec, '');
      trailheadRelays.push(relay);
    }
    return trailheadRelays.filter(Boolean);
  }
}

module.exports = ExperienceController;
