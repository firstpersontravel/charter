const _ = require('lodash');
const moment = require('moment');

const GeofenceCore = require('fptcore/src/cores/geofence');

const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const models = require('../models');

class DeviceStateHandler {
  /**
   * Update the participant device state.
   */
  static async _updateParticipantDeviceState(participant, fields) {
    const updates = {};
    const locationDate = new Date(fields.locationTimestamp * 1000);
    if (locationDate > participant.locationTimestamp || 0) {
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
    return participant.update(updates);
  }

  /**
   * Send notifications and enter geofences if needed.
   */
  static async _notifyNewDeviceState(participant, trip, player, oldState,
    clientId) {
    const script = await models.Script.findByPk(trip.scriptId);
    // Calculate new geofences
    const oldGeofences = GeofenceCore.geofencesInArea(
      script.content, oldState.latitude, oldState.longitude,
      oldState.accuracy, trip.waypointOptions);
    const newGeofences = GeofenceCore.geofencesInArea(
      script.content, participant.locationLatitude, participant.locationLongitude,
      participant.locationAccuracy, trip.waypointOptions);
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
      await KernelController.applyEvent(player.tripId, event);
      await NotifyController.notifyEvent(trip.id, event, clientId);
    }
    // Notify new device state
    await NotifyController.notifyParticipantDeviceState(trip.id, participant, clientId);
  }

  /**
   * Update participant state and send notifications to all active players.
   */
  static async updateDeviceState(participantId, fields, clientId=null) {
    const participant = await models.Participant.findByPk(participantId);
    const trips = await models.Trip.findAll({
      where: { isArchived: false }
    });
    // Save old state
    const oldState = {
      latitude: participant.latitude,
      longitude: participant.longitude,
      accuracy: participant.accuracy
    };
    await this._updateParticipantDeviceState(participant, fields);
    for (let trip of trips) {
      const player = await models.Player.findOne({
        where: { participantId: participant.id, tripId: trip.id }
      });
      if (!player) {
        continue;
      }
      await this._notifyNewDeviceState(participant, trip, player, oldState, clientId);
    }
  }
}

module.exports = DeviceStateHandler;
