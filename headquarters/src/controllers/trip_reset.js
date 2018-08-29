const _ = require('lodash');

const fptCore = require('fptcore');

const TripNotifyController = require('./trip_notify');
const models = require('../models');

/**
 * Reset a playthrough.
 */
async function resetPlaythrough(script, playthrough, checkpoint) {
  // Get schedule
  const schedule = fptCore.PlaythroughCore.getInitialSchedule(
    script, playthrough.date, playthrough.variantNames.split(','));
  // Get values
  const initialValues = fptCore.PlaythroughCore.getInitialValues(
    script, playthrough.variantNames.split(','));
  const preserveValueKeys = Object
    .keys(initialValues)
    .concat(['waypoint_options']);
  const resetValues = _.pick(playthrough.values, preserveValueKeys);
  const resetSceneName = checkpoint.scene || script.content.scenes[0].name;
  // Update values with checkpoint
  _.merge(resetValues, _.get(checkpoint, 'values.Global'));
  // Update!
  return await playthrough.update({
    currentSceneName: resetSceneName,
    schedule: schedule,
    values: resetValues,
    history: {}
  });
}

/**
 * Reset a participant.
 */
async function resetParticipant(script, playthrough, participant, checkpoint) {
  // Get values
  const fields = fptCore.ParticipantCore.getInitialFields(
    script, participant.roleName, playthrough.variantNames.split(','));
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
async function resetToCheckpoint(playthroughId, checkpointName) {
  const playthrough = await models.Playthrough.findById(playthroughId);
  const participants = await (
    models.Participant.findAll({ where: { playthroughId: playthroughId } })
  );
  // Get script
  const script = await playthrough.getScript();
  // Load checkpoint
  const checkpoint = _.find(script.content.checkpoints || [],
    { name: checkpointName });
  // Reset data
  await resetPlaythrough(script, playthrough, checkpoint);
  for (let participant of participants) {
    await resetParticipant(script, playthrough, participant, checkpoint);
  }
  // Clear actions and messages
  await models.Action.destroy({ where: { playthroughId: playthroughId }});
  await models.Message.destroy({ where: { playthroughId: playthroughId }});
  // Notify
  await TripNotifyController.notify(playthroughId, 'reload');
}

const TripResetController = {
  resetToCheckpoint: resetToCheckpoint
};

module.exports = TripResetController;
