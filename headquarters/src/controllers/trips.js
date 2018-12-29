const { TripCore, PlayerCore } = require('fptcore');

const models = require('../models');

class TripsController {
  /**
   * Create an initial player including default values.
   */
  static async _createPlayer(script, trip, role, variantNames) {
    const initialFields = PlayerCore.getInitialFields(script, role.name,
      variantNames);
    const fields = Object.assign(initialFields, {
      tripId: trip.id,
      userId: null,
    });
    return await models.Player.create(fields);
  }

  /**
   * Create an initial trip including players with default values.
   */
  static async createTrip(groupId, title, departureName, variantNames=[]) {
    const group = await models.Group.find({
      where: { id: groupId },
      include: [{
        model: models.Script,
        as: 'script',
        include: [{
          model: models.Experience,
          as: 'experience'
        }]
      }]
    });
    const initialFields = TripCore.getInitialFields(group.script, group.date,
      group.script.experience.timezone, variantNames);
    const scenes = group.script.content.scenes || [];
    const firstScene = scenes[0] || { name: '' };
    const tripFields = Object.assign({
      experienceId: group.script.experience.id,
      scriptId: group.script.id,
      groupId: group.id,
      date: group.date,
      title: title,
      currentSceneName: firstScene.name,
      departureName: departureName,
      variantNames: variantNames.join(','),
      history: {}
    }, initialFields);
    const trip = await models.Trip.create(tripFields);
    const roles = group.script.content.roles || [];
    for (let role of roles) {
      await this._createPlayer(group.script, trip, role, variantNames);
    }
    return trip;
  }
}

module.exports = TripsController;
