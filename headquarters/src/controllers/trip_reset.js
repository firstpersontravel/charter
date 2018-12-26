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
 * Reset a participant.
 */
async function resetParticipant(script, trip, participant, checkpoint) {
  // Get values
  const fields = fptCore.ParticipantCore.getInitialFields(
    script, participant.roleName, trip.variantNames.split(','));
  // Update values
  _.merge(fields.values, _.get(checkpoint, `values.${participant.roleName}`));
  // Check starting page
  if (_.get(checkpoint, 'pages.' + participant.roleName)) {
    fields.currentPageName = checkpoint.pages[participant.roleName];
  }
  await participant.update(fields);
  const user = await participant.getUser();
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
  const participants = await (
    models.Participant.findAll({ where: { tripId: tripId } })
  );
  // Get script
  const script = await trip.getScript();
  // Load checkpoint
  const checkpoint = _.find(script.content.checkpoints || [],
    { name: checkpointName });
  // Reset data
  await resetTrip(script, trip, checkpoint);
  for (let participant of participants) {
    await resetParticipant(script, trip, participant, checkpoint);
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
