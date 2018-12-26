const _ = require('lodash');

const fptCore = require('fptcore');

const TripNotifyController = require('./trip_notify');
const models = require('../models');

/**
 * Reset a trip.
 */
async function resetTrip(script, trip, checkpoint) {
  // Get schedule
  const schedule = fptCore.TripCore.getInitialSchedule(
    script, trip.date, trip.variantNames.split(','));
  // Get values
  const initialValues = fptCore.TripCore.getInitialValues(
    script, trip.variantNames.split(','));
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
async function resetPlayer(script, trip, player, checkpoint) {
  // Get values
  const fields = fptCore.PlayerCore.getInitialFields(
    script, player.roleName, trip.variantNames.split(','));
  // Update values
  _.merge(fields.values, _.get(checkpoint, `values.${player.roleName}`));
  // Check starting page
  if (_.get(checkpoint, 'pages.' + player.roleName)) {
    fields.currentPageName = checkpoint.pages[player.roleName];
  }
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
async function resetToCheckpoint(tripId, checkpointName) {
  const trip = await models.Trip.findById(tripId);
  const players = await (
    models.Player.findAll({ where: { tripId: tripId } })
  );
  // Get script
  const script = await trip.getScript();
  // Load checkpoint
  const checkpoint = _.find(script.content.checkpoints || [],
    { name: checkpointName });
  // Reset data
  await resetTrip(script, trip, checkpoint);
  for (let player of players) {
    await resetPlayer(script, trip, player, checkpoint);
  }
  // Clear actions and messages
  await models.Action.destroy({ where: { tripId: tripId }});
  await models.Message.destroy({ where: { tripId: tripId }});
  // Notify
  await TripNotifyController.notify(tripId, 'reload');
}

const TripResetController = {
  resetToCheckpoint: resetToCheckpoint
};

module.exports = TripResetController;
