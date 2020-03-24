const jwt = require('jsonwebtoken');

const config = require('../config');

const logger = config.logger.child({ name: 'middleware.auth' });

const tokenForReq = req => {
  if (req.get('Authorization')) {
    return req.get('Authorization').split(' ')[1];
  }
  return null;
};

const tokenPayloadForReq = async (req) => {
  const tokenString = tokenForReq(req);
  if (!tokenString) {
    return null;
  }
  try {
    return await jwt.verify(tokenString, config.env.JWT_SECRET);
  } catch (err) {
    logger.warn(err.message);
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  const token = await tokenPayloadForReq(req);
  if (token) {
    req.userId = token.sub;
  } else {
    req.userId = null;
  }
  next();
};

module.exports = {
  authMiddleware,
  tokenForReq,
  tokenPayloadForReq
};
