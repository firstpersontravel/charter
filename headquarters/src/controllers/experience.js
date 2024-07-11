const models = require('../models');

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
      }, {
        model: models.Org,
        as: 'org'
      }],
    });
  }
}

module.exports = ExperienceController;
