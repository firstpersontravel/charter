const _ = require('lodash');
const update = require('immutability-helper');

const fptCore = require('fptcore');

const MessageController = require('../controllers/message');
const TripRelaysController = require('../controllers/trip_relays');
const models = require('../models');

/**
 * Apply updates to a database instance.
 */
function applyUpdatesToInstance(instance, updates) {
  Object.keys(updates).forEach((key) => {
    if (key === 'values') {
      const values = _.cloneDeep(instance.values);
      fptCore.ActionResultCore.autovivify(values, updates.values);
      instance.values = update(values, updates.values);
    } else {
      instance[key] = update(instance[key], updates[key]);
    }
  });
}

async function updateUser(objs, op) {
  const participant = _.find(objs.participants, { roleName: op.roleName });
  const user = _.find(objs.users, { id: participant.userId });
  if (!user) {
    return null;
  }
  applyUpdatesToInstance(user, op.updates);
  return await user.save({ fields: Object.keys(op.updates) });
}

async function updatePlaythrough(objs, op) {
  applyUpdatesToInstance(objs.playthrough, op.updates);
  return await objs.playthrough.save({ fields: Object.keys(op.updates) });
}

async function updateParticipant(objs, op) {
  const participant = _.find(objs.participants, { roleName: op.roleName });
  applyUpdatesToInstance(participant, op.updates);
  return await participant.save({ fields: Object.keys(op.updates) });
}

async function createMessage(objs, op) {
  const fields = Object.assign({}, op.updates, {
    playthroughId: objs.playthrough.id,
    createdAt: op.updates.createdAt.toDate(),
    readAt: op.updates.readAt ? op.updates.readAt.toDate() : null
  });
  const message = await models.Message.create(fields);
  await MessageController.sendMessage(message);
  await TripRelaysController.relayMessage(objs.playthrough, message,
    op.suppressRelayId);
  return message;
}

async function initiateCall(objs, op) {
  return await TripRelaysController.initiateCall(
    objs.playthrough, op.toRoleName, op.asRoleName, op.detectVoicemail);
}

const opFunctions = {
  createMessage: createMessage,
  initiateCall: initiateCall,
  twiml: () => { /* ignore */ },
  updateAudio: () => { /* ignore */ },
  updatePlaythrough: updatePlaythrough,
  updateParticipant: updateParticipant,
  updateUser: updateUser,
  updateUi: () => { /* ignore */ }
};

/**
 * Apply a op to database objects.
 */
async function applyOp(objs, op) {
  const opFunction = opFunctions[op.operation];
  if (!opFunction) {
    throw new Error(`Invalid op ${op.operation}`);
  }
  return await opFunction(objs, op);
}

const TripOpController = {
  applyOp: applyOp
};

module.exports = TripOpController;
