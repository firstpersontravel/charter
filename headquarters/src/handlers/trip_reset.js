const _ = require('lodash');

const SceneCore = require('fptcore/src/cores/scene');
const TripCore = require('fptcore/src/cores/trip');
const PlayerCore = require('fptcore/src/cores/player');

const NotifyController = require('../controllers/notify');
const Kernel = require('../kernel/kernel');
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

    const firstSceneName = ((script.content.scenes || [])[0] || {}).name;
    const resetSceneName = checkpoint.scene || firstSceneName;

    // Update values with checkpoint
    _.merge(resetFields.values, checkpoint.values);

    // Update trip vars
    await trip.update({
      tripState: { currentSceneName: '' },
      schedule: resetFields.schedule,
      values: resetFields.values,
      history: {}
    });

    // And reset to new scene.
    if (resetSceneName) {
      const startSceneAction = {
        name: 'start_scene',
        params: { scene_name: resetSceneName }
      };
      await Kernel.applyAction(trip.id, startSceneAction);
    }

    return trip;
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
    if (player.user) {
      await player.user.update({
        locationLatitude: null,
        locationLongitude: null,
        locationAccuracy: null,
        locationTimestamp: null
      });
    }
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
    const players = await models.Player.findAll({
      where: { tripId: tripId },
      include: [{ model: models.User, as: 'user' }]
    });
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

  static async resetToStart(tripId) {
    await this.resetToCheckpoint(tripId, '__start');
  }
}

module.exports = TripResetHandler;
