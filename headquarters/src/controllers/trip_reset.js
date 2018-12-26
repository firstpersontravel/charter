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
    const schedule = TripCore.getInitialSchedule(script, trip.date, variants);
    const initialValues = TripCore.getInitialValues(script, variants);

    // Preserve some hard-coded keys, but reset the others
    const preserveValueKeys = Object
      .keys(initialValues)
      .concat(['waypoint_options']);
    const resetValues = _.pick(trip.values, preserveValueKeys);
    const resetSceneName = checkpoint.scene || script.content.scenes[0].name;

    // Update values with checkpoint
    _.merge(resetValues, _.get(checkpoint, 'values.Global'));

    // Update!
    return await trip.update({
      currentSceneName: resetSceneName,
      schedule: schedule,
      values: resetValues,
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
    // Update values
    _.merge(fields.values, _.get(checkpoint, `values.${player.roleName}`));
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
      include: [{ models: models.Script, as: 'script' }]
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
