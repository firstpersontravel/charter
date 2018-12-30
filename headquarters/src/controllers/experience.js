const models = require('../models');

class ExperienceController {
  static async findActiveScript(experienceId) {
    return await models.Script.find({
      where: {
        experienceId: experienceId,
        isActive: true,
        isArchived: false
      }
    });
  }
}

module.exports = ExperienceController;
