const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const config = require('../config');
const models = require('../models');
const { authenticationError } = require('../errors');

const tokenForReq = req => {
  if (req.get('Authorization')) {
    return req.get('Authorization').split(' ')[1];
  }
  return null;
};

async function verifyToken(tokenString) {
  return await jwt.verify(tokenString, config.env.HQ_JWT_SECRET, {
    algorithm: 'HS256',
    clockTimestamp: moment.utc().unix()
  });
}

async function authMiddleware(req, res, next) {
  const tokenString = tokenForReq(req);
  if (!tokenString) {
    req.auth = null;
    next();
    return;
  }

  let payload;
  try {
    payload = await verifyToken(tokenString);
  } catch (err) {
    next(authenticationError('Invalid token'));
    return;
  }

  // Support existing tokens w/o a type.
  const [subType, subId] = payload.sub.toString().includes(':') ?
    payload.sub.split(':') : ['user', payload.sub];

  // Load user for user token
  if (subType === 'user') {
    const user = await models.User.findByPk(Number(subId), {
      include: [{ model: models.OrgRole, as: 'orgRoles' }]
    });
    if (!user) {
      next(authenticationError('Invalid user'));
      return;
    }
    req.auth = {
      type: 'user',
      user: user
    };
    next();
    return;
  }

  // Check participant
  if (subType === 'participant') {
    const participant = await models.Participant.findByPk(Number(subId));
    if (!participant) {
      next(authenticationError('Invalid participant'));
      return;
    }
    const players = await models.Player.findAll({
      where: { participantId: participant.id },
      include: [{
        model: models.Trip,
        as: 'trip',
        where: { isArchived: false }
      }]
    });
    req.auth = {
      type: 'participant',
      participant: participant,
      players: players
    };
    next();
    return;
  }

  // Check trip
  if (subType === 'trip') {
    const trip = await models.Trip.findByPk(Number(subId));
    if (!trip) {
      next(authenticationError('Invalid trip'));
      return;
    }
    const players = await models.Player.findAll({
      where: { tripId: trip.id }
    });
    req.auth = {
      type: 'trip',
      trip: trip,
      players: players
    };
    next();
    return;
  }

  // Invalid sub type
  next(authenticationError('Invalid token'));
  return;
}

module.exports = {
  authMiddleware,
  tokenForReq,
  verifyToken
};
