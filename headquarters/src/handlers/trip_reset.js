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
  static async _resetTrip(script, trip, timezone, sceneName) {
    // Get schedule and values
    const variants = trip.variantNames.split(',');
    const resetFields = TripCore.getInitialFields(script.content,
      trip.date, timezone, variants);

    // Update trip vars
    await trip.update({
      tripState: {
        currentSceneName: '',
        currentPageNamesByRole: {}
      },
      schedule: resetFields.schedule,
      values: resetFields.values,
      history: {}
    });

    // And reset to new scene.
    const startSceneAction = {
      name: 'start_scene',
      params: { scene_name: sceneName }
    };
    await Kernel.applyAction(trip.id, startSceneAction);
  }

  /**
   * Reset a player.
   */
  static async _resetPlayer(script, trip, player) {
    // Get values
    const variants = trip.variantNames.split(',');
    const fields = PlayerCore.getInitialFields(script.content, player.roleName,
      variants);

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
  static async resetToStart(tripId) {
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

    // Reset to starting scene
    const startingSceneName = SceneCore.getStartingSceneName(
      trip.script.content, actionContext);

    // Clear actions and messages
    await models.Action.destroy({ where: { tripId: tripId }});
    await models.Message.destroy({ where: { tripId: tripId }});

    // Reset data
    await this._resetTrip(trip.script, trip, trip.experience.timezone,
      startingSceneName);
    for (let player of players) {
      await this._resetPlayer(trip.script, trip, player);
    }

    // Notify
    await NotifyController.notify(tripId, 'reload');
  }
}

module.exports = TripResetHandler;
