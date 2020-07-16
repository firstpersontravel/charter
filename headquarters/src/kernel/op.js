const _ = require('lodash');

const config = require('../config');
const EmailController = require('../controllers/email');
const MessageController = require('../controllers/message');
const KernelLogger = require('./logger');
const TripRelaysController = require('../controllers/trip_relays');
const models = require('../models');

const logger = config.logger.child({ name: 'kernel.op' });

class KernelOpController {
  static async twiml() { /* ignore */ }
  static async updateAudio() { /* ignore */ }
  static async updateUi() { /* ignore */ }
  static async wait() { /* ignore - handled internally */ }
  static async event() { /* special case - handled directly in kernely */ }

  static async log(objs, op) {
    logger[op.level].call(logger, op.message);
    KernelLogger.log(objs.trip, op.level, op.message);
  }

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
    const players = _.filter(objs.players, { roleName: op.roleName });
    return Promise.all(players.map(player => player.update(op.fields)));
  }

  static async createMessage(objs, op) {
    const fields = {
      orgId: objs.trip.orgId,
      experienceId: objs.trip.experienceId,
      tripId: objs.trip.id,
      fromRoleName: op.fields.fromRoleName,
      toRoleName: op.fields.toRoleName,
      createdAt: op.fields.createdAt.toDate(),
      name: op.fields.name,
      medium: op.fields.medium,
      content: op.fields.content,
      readAt: op.fields.readAt ? op.fields.readAt.toDate() : null,
      isReplyNeeded: op.fields.isReplyNeeded,
      isInGallery: op.fields.isInGallery
    };
    const message = await models.Message.create(fields);
    await MessageController.sendMessage(message);
    if (!fields.readAt) {
      await TripRelaysController.relayMessage(objs.trip, message,
        op.suppressRelayId);
    }
    return message;
  }

  static async sendEmail(objs, op) {
    const toPlayers = objs.players
      .filter(p => p.roleName === op.toRoleName && p.participantId)
      .filter((p) => {
        const participant = objs.participants.find(u => u.id === p.participantId);
        return participant && participant.email;
      });
    // Send email to each player matching role name.
    for (const toPlayer of toPlayers) {
      const toParticipant = objs.participants.find(u => u.id === toPlayer.participantId);
      await EmailController.sendEmail(op.fromEmail, toParticipant.email,
        op.subject, op.bodyMarkdown);
    }
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

module.exports = KernelOpController;
