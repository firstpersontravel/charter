const moment = require('moment-timezone');

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
      experienceId: trip.experienceId,
      tripId: trip.id,
      participantId: null,
    });
    return await models.Player.create(fields);
  }

  /**
   * Create an initial trip including players with default values.
   */
  static async createTrip(experienceId, title, variantNames=[]) {
    const experience = await models.Experience.findByPk(experienceId);
    const script = await models.Script.findOne({
      where: { experienceId: experienceId, isActive: true }
    });
    const date = moment.utc().format('YYYY-MM-DD');
    const initialFields = TripCore.getInitialFields(
      script.content, date,
      experience.timezone, variantNames);
    const tripFields = Object.assign({
      createdAt: moment.utc(),
      updatedAt: moment.utc(),
      orgId: experience.orgId,
      experienceId: experience.id,
      scriptId: script.id,
      date: date,
      title: title,
      tripState: { currentSceneName: '' },
      variantNames: variantNames.join(','),
      history: {}
    }, initialFields);

    // Create trip on first scene
    const trip = await models.Trip.create(tripFields);
    const roles = script.content.roles || [];
    for (let role of roles) {
      await this._createPlayer(script.content, trip, role, variantNames);
    }

    return trip;
  }
}

module.exports = TripsController;
