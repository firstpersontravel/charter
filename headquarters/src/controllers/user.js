const _ = require('lodash');
const moment = require('moment');

const fptCore = require('fptcore');

const TripActionController = require('./trip_action');
const TripNotifyController = require('./trip_notify');
const models = require('../models');

const UserController = {};

UserController.updateUserWithDeviceState = async (user, fields) => {
  const updates = {};
  const locationDate = new Date(fields.locationTimestamp * 1000);
  if (locationDate > user.locationTimestamp || 0) {
    updates.locationLatitude = fields.locationLatitude;
    updates.locationLongitude = fields.locationLongitude;
    updates.locationTimestamp = new Date(fields.locationTimestamp * 1000);
    updates.locationAccuracy = fields.locationAccuracy;
  }
  if (fields.deviceBattery) {
    updates.deviceTimestamp = moment.utc();
    updates.deviceBattery = fields.deviceBattery;
  }
  if (fields.deviceIsActive) {
    updates.deviceLastActive = moment.utc();
  }
  return user.update(updates);
};

UserController.updateParticipantDeviceState = async (
  user, playthrough, participant, oldState, clientId
) => {
  const script = await models.Script.findById(playthrough.scriptId);
  // Calculate new geofences
  const oldGeofences = fptCore.ScriptCore.geofencesInArea(
    script.content, oldState.latitude, oldState.longitude,
    oldState.accuracy, playthrough.values.waypoint_options);
  const newGeofences = fptCore.ScriptCore.geofencesInArea(
    script.content, user.locationLatitude, user.locationLongitude,
    user.locationAccuracy, playthrough.values.waypoint_options);
  const enteredGeofenceNames = _.difference(
    _.map(newGeofences, 'name'),
    _.map(oldGeofences, 'name')
  );
  // And run actions for entering new geofences
  for (let geofenceName of enteredGeofenceNames) {
    const event = {
      type: 'geofence_entered',
      role: participant.roleName,
      geofence: geofenceName
    };
    await TripActionController.applyEvent(participant.playthroughId, event);
    await TripNotifyController.notifyEvent(playthrough.id, event, clientId);
  }
  // Notify new device state
  await TripNotifyController
    .notifyUserDeviceState(playthrough.id, user, clientId);
};

// Location update path
// Native update from tablet
//   - iOS -> server update_device_state
//            -> creates enterGeofence events on server
//               -> calls realtimeEvents.event with enterGeofence on
//                  other clients [NEEDED]
//            -> sends 'device_state' realtime event to other clients
//               -> calls realtimeEvents.deviceState on other clients
//                  -> sets user.location props locally (no new event)
//                  -> does not enterGeofence events locally
//   - iOS -> local nativeLocationUpdate
//            -> sets user.location props locally (no new event)
//            -> creates enterGeofence events locally
// Web update from tablet location or debug bar
//   - web > `location.handleFix` > `lastFixDidChange` >
//     `participant.updateLocation`
//     -> server update_device_state
//          -> creates enterGeofence events on server
//             -> calls realtimeEvents.event with enterGeofence on
//                other clients [NEEDED]
//          -> sends 'device_state' realtime event to other clients
//             -> calls realtimeEvents.deviceState on other clients
//                -> sets user.location props locally (no new event)
//                -> does not enterGeofence events locally
//     -> create enterGeofence events locally
UserController.updateDeviceState = async(userId, fields, clientId=null) => {
  const user = await models.User.findById(userId);
  const playthroughs = await models.Playthrough.findAll({
    where: { isArchived: false }
  });
  // Save old state
  const oldState = {
    latitude: user.latitude,
    longitude: user.longitude,
    accuracy: user.accuracy
  };
  await UserController.updateUserWithDeviceState(user, fields);
  for (let playthrough of playthroughs) {
    const participant = await models.Participant.find({
      where: {
        userId: user.id,
        playthroughId: playthrough.id,
      }
    });
    if (!participant) {
      continue;
    }
    await UserController.updateParticipantDeviceState(
      user, playthrough, participant, oldState, clientId);
  }
};

module.exports = UserController;
