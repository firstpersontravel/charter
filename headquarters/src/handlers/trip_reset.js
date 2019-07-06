const _ = require('lodash');

const SceneCore = require('../../../fptcore/src/cores/scene');
const TripCore = require('../../../fptcore/src/cores/trip');
const PlayerCore = require('../../../fptcore/src/cores/player');

const NotifyController = require('../controllers/notify');
const KernelUtil = require('../kernel/util');
const models = require('../models');

class TripResetHandler {
  /**
   * Reset a trip.
   */
  static async _resetTrip(script, trip, timezone, checkpoint) {
    // Get schedule and values
    const variants = trip.variantNames.split(',');
    const resetFields = TripCore.getInitialFields(script.content,
      trip.date, timezone, variants);
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
    const fields = PlayerCore.getInitialFields(script.content, player.roleName,
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
    const trip = await models.Trip.findOne({
      where: { id: tripId },
      include: [
        { model: models.Script, as: 'script' },
        { model: models.Experience, as: 'experience' }
      ]
    });
    const actionContext = await KernelUtil.getActionContext(tripId);
    const players = await models.Player.findAll({ where: { tripId: tripId } });
    // Create hardcoded default 'start' checkpoint
    const startingScene = SceneCore.getStartingSceneName(trip.script.content,
      actionContext);
    const start = { name: '__start', scene: startingScene };
    // Load checkpoint
    const checkpoints = [start].concat(trip.script.content.checkpoints || []);
    const checkpoint = _.find(checkpoints, { name: checkpointName });
    // Reset data
    await this._resetTrip(trip.script, trip, trip.experience.timezone,
      checkpoint);
    for (let player of players) {
      await this._resetPlayer(trip.script, trip, player, checkpoint);
    }
    // Clear actions and messages
    await models.Action.destroy({ where: { tripId: tripId }});
    await models.Message.destroy({ where: { tripId: tripId }});
    // Notify
    await NotifyController.notify(tripId, 'reload');
  }
}

module.exports = TripResetHandler;
