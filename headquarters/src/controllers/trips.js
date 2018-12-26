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
    const group = await models.Group.findById(groupId);
    const script = await models.Script.findById(group.scriptId);
    const values = TripCore.getInitialValues(script, variantNames);
    const schedule = TripCore.getInitialSchedule(script, group.date,
      variantNames);
    const scenes = script.content.scenes || [];
    const firstScene = scenes[0] || { name: '' };
    const trip = await models.Trip.create({
      scriptId: group.scriptId,
      groupId: group.id,
      date: group.date,
      title: title,
      currentSceneName: firstScene.name,
      departureName: departureName,
      variantNames: variantNames.join(','),
      values: values,
      schedule: schedule
    });
    const roles = script.content.roles || [];
    for (let role of roles) {
      await this._createPlayer(script, trip, role, variantNames);
    }
    return trip;
  }
}

module.exports = TripsController;
