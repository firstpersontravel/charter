const _ = require('lodash');
const moment = require('moment');

const GeofenceCore = require('../../../fptcore/src/cores/geofence');

const TripActionController = require('./trip_action');
const TripNotifyController = require('./trip_notify');
const models = require('../models');

class UserController {
  /**
   * Update the user device state.
   */
  static async _updateUserDeviceState(user, fields) {
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
  }

  /**
   * Send notifications and enter geofences if needed.
   */
  static async _notifyNewDeviceState(user, trip, player, oldState,
    clientId) {
    const script = await models.Script.findById(trip.scriptId);
    // Calculate new geofences
    const oldGeofences = GeofenceCore.geofencesInArea(
      script.content, oldState.latitude, oldState.longitude,
      oldState.accuracy, trip.waypointOptions);
    const newGeofences = GeofenceCore.geofencesInArea(
      script.content, user.locationLatitude, user.locationLongitude,
      user.locationAccuracy, trip.waypointOptions);
    const enteredGeofenceNames = _.difference(
      _.map(newGeofences, 'name'),
      _.map(oldGeofences, 'name')
    );
    // And run actions for entering new geofences
    for (let geofenceName of enteredGeofenceNames) {
      const event = {
        type: 'geofence_entered',
        role: player.roleName,
        geofence: geofenceName
      };
      await TripActionController.applyEvent(player.tripId, event);
      await TripNotifyController.notifyEvent(trip.id, event, clientId);
    }
    // Notify new device state
    await TripNotifyController.notifyUserDeviceState(trip.id, user, clientId);
  }

  /**
   * Update user state and send notifications to all active players.
   *
   * Location update path
   * Native update from tablet
   *   - iOS -> server update_device_state
   *            -> creates enterGeofence events on server
   *               -> calls realtimeEvents.event with enterGeofence on
   *                  other clients [NEEDED]
   *            -> sends 'device_state' realtime event to other clients
   *               -> calls realtimeEvents.deviceState on other clients
   *                  -> sets user.location props locally (no new event)
   *                  -> does not enterGeofence events locally
   *   - iOS -> local nativeLocationUpdate
   *            -> sets user.location props locally (no new event)
   *            -> creates enterGeofence events locally
   * Web update from tablet location or debug bar
   *   - web > `location.handleFix` > `lastFixDidChange` >
   *     `player.updateLocation`
   *     -> server update_device_state
   *          -> creates enterGeofence events on server
   *             -> calls realtimeEvents.event with enterGeofence on
   *                other clients [NEEDED]
   *          -> sends 'device_state' realtime event to other clients
   *             -> calls realtimeEvents.deviceState on other clients
   *                -> sets user.location props locally (no new event)
   *                -> does not enterGeofence events locally
   *     -> create enterGeofence events locally
   */
  static async updateDeviceState(userId, fields, clientId=null) {
    const user = await models.User.findById(userId);
    const trips = await models.Trip.findAll({
      where: { isArchived: false }
    });
    // Save old state
    const oldState = {
      latitude: user.latitude,
      longitude: user.longitude,
      accuracy: user.accuracy
    };
    await this._updateUserDeviceState(user, fields);
    for (let trip of trips) {
      const player = await models.Player.find({
        where: { userId: user.id, tripId: trip.id }
      });
      if (!player) {
        continue;
      }
      await this._notifyNewDeviceState(user, trip, player, oldState, clientId);
    }
  }
}

module.exports = UserController;
