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
    req.auth = { user: user };
    next();
    return;
  }

  // Check participant
  if (subType === 'participant') {
    const participant = await models.Participant.findByPk(Number(subId));
    const players = await models.Player.findAll({
      where: { participantId: participant.id },
      include: [{
        model: models.Trip,
        where: { isArchived: false }
      }]
    });
    if (!participant) {
      next(authenticationError('Invalid participant'));
      return;
    }
    req.auth = { participant: participant, players: players };
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
    req.auth = { trip: trip };
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
