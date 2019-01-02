const jwt = require('jsonwebtoken');

const config = require('../config');

const logger = config.logger.child({ name: 'middleware.auth' });

const AUTH_COOKIE_NAME = 'fptauth';

const tokenForReq = async (req) => {
  const tokenString = req.cookies[AUTH_COOKIE_NAME];
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
  const token = await tokenForReq(req);
  if (token) {
    req.userId = token.sub;
  } else {
    req.userId = null;
  }
  next();
};

module.exports = {
  AUTH_COOKIE_NAME,
  authMiddleware,
  tokenForReq
};
