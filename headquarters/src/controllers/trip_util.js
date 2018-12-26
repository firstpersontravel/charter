const _ = require('lodash');

const fptCore = require('fptcore');

const config = require('../config');
const models = require('../models');

/**
 * Create participant context with the user and profile objects.
 */
function assembleParticipantFields(objs, participant) {
  const userInstance = participant.userId ?
    _.find(objs.users, u => u.id === participant.userId) :
    null;
  const user = userInstance ? userInstance.get({ plain: true }) : null;
  if (user) {
    const profileInstance = user ? _.find(objs.profiles, {
      userId: participant.userId,
      scriptName: objs.script.name,
      roleName: participant.roleName,
    }) : null;
    if (profileInstance) {
      user.profile = profileInstance.get({ plain: true });
    }
  }

  return Object.assign(participant.get({ plain: true }), {
    user: user
  });
}

function assembleTripFields(objs) {
  const trip = objs.trip.get({ plain: true });
  return Object.assign(trip, {
    script: objs.script.get({ plain: true }),
    participants: _.map(objs.participants, participant => (
      assembleParticipantFields(objs, participant)
    ))
  });
}

/**
 * Create trip context suitable for passing into the action parser.
 */
function createContext(objs) {
  const trip = assembleTripFields(objs);
  // Only allow custom hosts in production.
  const host = config.env.STAGE === 'production' ? 
    (objs.script.host || config.env.SERVER_HOST_PUBLIC) :
    config.env.SERVER_HOST_PUBLIC;
  const env = { host: host };
  const context = fptCore.EvalCore.gatherContext(env, trip);
  return context;
}

/**
 * Apply an action and gather the results.
 */
async function getContext(tripId) {
  const objs = await getObjectsForTrip(tripId);
  return createContext(objs);
}

/**
 * Get objects needed for a trip.
 */
async function getObjectsForTrip(tripId) {
  // Get trip and participants first
  const trip = await models.Trip.findById(tripId);
  const participants = await models.Participant.findAll({
    where: { tripId: tripId }
  });
  const script = await models.Script.findById(trip.scriptId);
  const profiles = await models.Profile.findAll({
    where: { scriptName: script.name }
  });
  const users = await models.User.findAll({
    where: {
      id: _.map(participants, 'dataValues.userId').filter(Boolean)
    }
  });
  return {
    trip,
    participants,
    script,
    profiles,
    users
  };
}


/**
 * Expand an action phrase in context.
 */
async function expandActionPhrase(tripId, actionPhrase, evaluateAt) {
  const objs = await getObjectsForTrip(tripId);
  const context = createContext(objs);
  return fptCore.ActionPhraseCore.expandActionPhrase(
    actionPhrase, evaluateAt, context);
}

const TripUtil = {
  createContext: createContext,
  expandActionPhrase: expandActionPhrase,
  getObjectsForTrip: getObjectsForTrip,
  getContext: getContext
};

module.exports = TripUtil;
