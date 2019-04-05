const TripCore = require('../../../fptcore/src/cores/trip');
const PlayerCore = require('../../../fptcore/src/cores/player');

const models = require('../models');

class TripsController {
  /**
   * Create an initial player including default values.
   */
  static async _createPlayer(scriptContent, trip, role, variantNames) {
    const initialFields = PlayerCore.getInitialFields(scriptContent, role.name,
      variantNames);
    const fields = Object.assign(initialFields, {
      orgId: trip.orgId,
      tripId: trip.id,
      userId: null,
    });
    return await models.Player.create(fields);
  }

  /**
   * Create an initial trip including players with default values.
   */
  static async createTrip(groupId, title, departureName, variantNames=[]) {
    const group = await models.Group.findOne({
      where: { id: groupId },
      include: [
        { model: models.Script, as: 'script' },
        { model: models.Experience, as: 'experience' }
      ]
    });
    const initialFields = TripCore.getInitialFields(
      group.script.content, group.date,
      group.experience.timezone, variantNames);
    const scenes = group.script.content.scenes || [];
    const firstScene = scenes[0] || { name: '' };
    const tripFields = Object.assign({
      orgId: group.orgId,
      experienceId: group.experience.id,
      groupId: group.id,
      scriptId: group.script.id,
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
      await this._createPlayer(group.script.content, trip, role, variantNames);
    }
    return trip;
  }
}

module.exports = TripsController;
