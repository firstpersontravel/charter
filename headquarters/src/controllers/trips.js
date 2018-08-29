const fptCore = require('fptcore');

const models = require('../models');

const TripsController = {};

/**
 * Create an initial participant including default values.
 */
TripsController.createParticipant = async (
  script, playthrough, role, variantNames
) => {
  const initialFields = fptCore.ParticipantCore.getInitialFields(
    script, role.name, variantNames);
  const fields = Object.assign(initialFields, {
    playthroughId: playthrough.id,
    userId: null,
  });
  return await models.Participant.create(fields);
};

/**
 * Create an initial playthrough including participants with default values.
 */
TripsController.createWithDefaults = async (
  groupId, title, departureName, variantNames=[]
) => {
  const group = await models.Group.findById(groupId);
  const script = await models.Script.findById(group.scriptId);
  const values = fptCore.PlaythroughCore
    .getInitialValues(script, variantNames);
  const schedule = fptCore.PlaythroughCore
    .getInitialSchedule(script, group.date, variantNames);
  const scenes = script.content.scenes || [];
  const firstScene = scenes[0] || { name: '' };
  const playthrough = await models.Playthrough.create({
    scriptId: group.scriptId,
    groupId: group.id,
    date: group.date,
    title: title,
    currentSceneName: firstScene.name,
    departureName: departureName,
    variantNames: variantNames.join(','),
    values: values,
    schedule: schedule
  });
  const roles = script.content.roles || [];
  for (let role of roles) {
    await TripsController.createParticipant(
      script, playthrough, role, variantNames);
  }
  return playthrough;
};

module.exports = TripsController;
