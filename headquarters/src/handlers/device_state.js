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
  static async _notifyNewDeviceState(participant, player, oldState, clientId) {
    // Calculate old and new geofences
    const oldGeofences = GeofenceCore.geofencesInArea(
      player.trip.script.content, oldState.latitude, oldState.longitude,
      oldState.accuracy, player.trip.waypointOptions);
    const oldGeofenceNames = _.map(oldGeofences, 'name');
    const newGeofences = GeofenceCore.geofencesInArea(
      player.trip.script.content, participant.locationLatitude, participant.locationLongitude,
      participant.locationAccuracy, player.trip.waypointOptions);
    const newGeofenceNames = _.map(newGeofences, 'name');
    
    // Run actions for entering geofences
    const enteredGeofenceNames = _.difference(newGeofenceNames, oldGeofenceNames);
    for (let geofenceName of enteredGeofenceNames) {
      const event = {
        type: 'geofence_entered',
        role: player.roleName,
        geofence: geofenceName
      };
      await KernelController.applyEvent(player.tripId, event);
      await NotifyController.notifyEvent(player.tripId, event, clientId);
    }
    
    // Run actions for exiting geofences
    const exitedGeofenceNames = _.difference(oldGeofenceNames, newGeofenceNames);
    for (let geofenceName of exitedGeofenceNames) {
      const event = {
        type: 'geofence_exited',
        role: player.roleName,
        geofence: geofenceName
      };
      await KernelController.applyEvent(player.tripId, event);
      await NotifyController.notifyEvent(player.tripId, event, clientId);
    }

    // Notify new device state
    await NotifyController.notifyParticipantDeviceState(player.tripId, participant, clientId);
  }

  /**
   * Update participant state and send notifications to all active players.
   */
  static async updateDeviceState(participantId, fields, clientId=null) {
    const participant = await models.Participant.findByPk(participantId);
    const players = await models.Player.findAll({
      where: {
        participantId: participantId
      },
      include: [{
        model: models.Trip,
        as: 'trip',
        where: { isArchived: false },
        include: [{
          model: models.Group,
          as: 'group',
          where: { isArchived: false }
        }, {
          model: models.Script,
          as: 'script'
        }]
      }]
    });
    // Save old state
    const oldState = {
      latitude: participant.locationLatitude,
      longitude: participant.locationLongitude,
      accuracy: participant.locationAccuracy
    };
    await this._updateParticipantDeviceState(participant, fields);
    for (const player of players) {
      await this._notifyNewDeviceState(participant, player, oldState, clientId);
    }
  }
}

module.exports = DeviceStateHandler;
