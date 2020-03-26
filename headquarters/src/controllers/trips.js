const moment = require('moment');

const TripCore = require('fptcore/src/cores/trip');
const PlayerCore = require('fptcore/src/cores/player');

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
  static async createTrip(groupId, title, variantNames=[]) {
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
    const tripFields = Object.assign({
      createdAt: moment.utc(),
      updatedAt: moment.utc(),
      orgId: group.orgId,
      experienceId: group.experience.id,
      groupId: group.id,
      scriptId: group.script.id,
      date: group.date,
      title: title,
      currentSceneName: '',
      variantNames: variantNames.join(','),
      history: {}
    }, initialFields);

    // Create trip on first scene
    const trip = await models.Trip.create(tripFields);
    const roles = group.script.content.roles || [];
    for (let role of roles) {
      await this._createPlayer(group.script.content, trip, role, variantNames);
    }

    return trip;
  }
}

module.exports = TripsController;
