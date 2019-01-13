const _ = require('lodash');

const models = require('../models');
const RelaysController = require('./relays');

class ExperienceController {

  /**
   * Locate the one active script for new trips etc.
   */
  static async findActiveScript(experienceId) {
    return await models.Script.find({
      where: {
        experienceId: experienceId,
        isActive: true,
        isArchived: false
      }
    });
  }

  /**
   * Create trailhead relays.
   */
  static async ensureTrailheads(experienceId) {
    // Get active script by name
    const experience = await models.Experience.findById(experienceId);
    const script = await this.findActiveScript(experience.id);

    // Create only trailhead relays
    const trailheadRelays = _.filter(script.content.relays, {
      trailhead: true
    });
    const departures = script.content.departures;
    const departureNames = departures.length > 0 ?
      _.map(departures, 'name') : [''];
    for (const departureName of departureNames) {
      for (const relaySpec of trailheadRelays) {
        await RelaysController.ensureRelay(experience.orgId, experienceId, 
          departureName, relaySpec, '');
      }
    }
  }
}

module.exports = ExperienceController;
