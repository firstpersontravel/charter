const _ = require('lodash');

const EmailController = require('../controllers/email');
const MessageController = require('../controllers/message');
const TripRelaysController = require('../controllers/trip_relays');
const models = require('../models');

class TripOpController {

  static async twiml() { /* ignore */ }
  static async updateAudio() { /* ignore */ }
  static async updateUi() { /* ignore */ }

  static async updateTripFields(objs, op) {
    return await objs.trip.update(op.fields);
  }

  static async updateTripValues(objs, op) {
    return await objs.trip.update({
      values: Object.assign(objs.trip.values, op.values)
    });
  }

  static async updateTripHistory(objs, op) {
    return await objs.trip.update({
      history: Object.assign(objs.trip.history, op.history)
    });
  }

  static async updatePlayerFields(objs, op) {
    const player = _.find(objs.players, { roleName: op.roleName });
    return await player.update(op.fields);
  }

  static async createMessage(objs, op) {
    const fields = Object.assign({}, op.fields, {
      orgId: objs.trip.orgId,
      experienceId: objs.trip.experienceId,
      tripId: objs.trip.id,
      createdAt: op.fields.createdAt.toDate(),
      readAt: op.fields.readAt ? op.fields.readAt.toDate() : null
    });
    const message = await models.Message.create(fields);
    await MessageController.sendMessage(message);
    if (!fields.readAt) {
      await TripRelaysController.relayMessage(objs.trip, message,
        op.suppressRelayId);
    }
    return message;
  }

  static async sendEmail(objs, op) {
    return EmailController.sendEmail(op.params);
  }

  static async initiateCall(objs, op) {
    return await TripRelaysController.initiateCall(
      objs.trip, op.toRoleName, op.asRoleName, op.detectVoicemail);
  }

  /**
   * Apply an op to database objects.
   */
  static async applyOp(objs, op) {
    const opFunction = this[op.operation];
    if (!opFunction) {
      throw new Error(`Invalid op ${op.operation}`);
    }
    return await opFunction.call(this, objs, op);
  }
}

module.exports = TripOpController;
