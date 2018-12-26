const fptCore = require('fptcore');

const models = require('../models');

const TripsController = {};

/**
 * Create an initial player including default values.
 */
TripsController.createPlayer = async (
  script, trip, role, variantNames
) => {
  const initialFields = fptCore.PlayerCore.getInitialFields(
    script, role.name, variantNames);
  const fields = Object.assign(initialFields, {
    tripId: trip.id,
    userId: null,
  });
  return await models.Player.create(fields);
};

/**
 * Create an initial trip including players with default values.
 */
TripsController.createWithDefaults = async (
  groupId, title, departureName, variantNames=[]
) => {
  const group = await models.Group.findById(groupId);
  const script = await models.Script.findById(group.scriptId);
  const values = fptCore.TripCore
    .getInitialValues(script, variantNames);
  const schedule = fptCore.TripCore
    .getInitialSchedule(script, group.date, variantNames);
  const scenes = script.content.scenes || [];
  const firstScene = scenes[0] || { name: '' };
  const trip = await models.Trip.create({
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
    await TripsController.createPlayer(
      script, trip, role, variantNames);
  }
  return trip;
};

module.exports = TripsController;
