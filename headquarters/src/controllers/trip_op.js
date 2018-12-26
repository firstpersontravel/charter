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
  const player = _.find(objs.players, { roleName: op.roleName });
  const user = _.find(objs.users, { id: player.userId });
  if (!user) {
    return null;
  }
  applyUpdatesToInstance(user, op.updates);
  return await user.save({ fields: Object.keys(op.updates) });
}

async function updateTrip(objs, op) {
  applyUpdatesToInstance(objs.trip, op.updates);
  return await objs.trip.save({ fields: Object.keys(op.updates) });
}

async function updatePlayer(objs, op) {
  const player = _.find(objs.players, { roleName: op.roleName });
  applyUpdatesToInstance(player, op.updates);
  return await player.save({ fields: Object.keys(op.updates) });
}

async function createMessage(objs, op) {
  const fields = Object.assign({}, op.updates, {
    tripId: objs.trip.id,
    createdAt: op.updates.createdAt.toDate(),
    readAt: op.updates.readAt ? op.updates.readAt.toDate() : null
  });
  const message = await models.Message.create(fields);
  await MessageController.sendMessage(message);
  await TripRelaysController.relayMessage(objs.trip, message,
    op.suppressRelayId);
  return message;
}

async function initiateCall(objs, op) {
  return await TripRelaysController.initiateCall(
    objs.trip, op.toRoleName, op.asRoleName, op.detectVoicemail);
}

const opFunctions = {
  createMessage: createMessage,
  initiateCall: initiateCall,
  twiml: () => { /* ignore */ },
  updateAudio: () => { /* ignore */ },
  updateTrip: updateTrip,
  updatePlayer: updatePlayer,
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
