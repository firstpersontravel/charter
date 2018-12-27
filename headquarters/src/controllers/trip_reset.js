const _ = require('lodash');

const { TripCore, PlayerCore } = require('fptcore');

const TripNotifyController = require('./trip_notify');
const models = require('../models');

class TripResetController {
  /**
   * Reset a trip.
   */
  static async _resetTrip(script, trip, checkpoint) {
    // Get schedule and values
    const variants = trip.variantNames.split(',');
    const resetFields = TripCore.getInitialFields(script, trip.date, variants);
    const resetSceneName = checkpoint.scene || script.content.scenes[0].name;

    // Update values with checkpoint
    _.merge(resetFields.values, checkpoint.values);

    // Update!
    return await trip.update({
      currentSceneName: resetSceneName,
      schedule: resetFields.schedule,
      values: resetFields.values,
      history: {}
    });
  }

  /**
   * Reset a player.
   */
  static async _resetPlayer(script, trip, player, checkpoint) {
    // Get values
    const variants = trip.variantNames.split(',');
    const fields = PlayerCore.getInitialFields(script, player.roleName,
      variants);
    // Check starting page
    if (_.get(checkpoint, 'pages.' + player.roleName)) {
      fields.currentPageName = checkpoint.pages[player.roleName];
    }

    // Reset user location
    await player.update(fields);
    const user = await player.getUser();
    if (!user) {
      return;
    }
    return await user.update({
      locationLatitude: null,
      locationLongitude: null,
      locationAccuracy: null,
      locationTimestamp: null
    });
  }

  /**
   * Reset a game state.
   */
  static async resetToCheckpoint(tripId, checkpointName) {
    const trip = await models.Trip.find({
      where: { id: tripId },
      include: [{ model: models.Script, as: 'script' }]
    });
    const players = await models.Player.findAll({ where: { tripId: tripId } });
    // Load checkpoint
    const checkpoint = _.find(trip.script.content.checkpoints || [],
      { name: checkpointName });
    // Reset data
    await this._resetTrip(trip.script, trip, checkpoint);
    for (let player of players) {
      await this._resetPlayer(trip.script, trip, player, checkpoint);
    }
    // Clear actions and messages
    await models.Action.destroy({ where: { tripId: tripId }});
    await models.Message.destroy({ where: { tripId: tripId }});
    // Notify
    await TripNotifyController.notify(tripId, 'reload');
  }
}

module.exports = TripResetController;
