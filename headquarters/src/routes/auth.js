const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../config');
const models = require('../models');
const authMiddleware = require('../middleware/auth');

function createJwt(user, durationSecs) {
  const payload = { iss: 'fpt', sub: user.id, aud: 'web' };
  const opts = { expiresIn: durationSecs, algorithm: 'HS256' };
  const token = jwt.sign(payload, config.env.JWT_SECRET, opts);
  return token;
}

// Dummy hash of '12345'.
const DUMMY_HASH = '$2b$10$H2vj6CxZj7NgrAusLS2QdOi4VlyHfFA.oKzjEZlPE1m2CdF63WjcW';

/**
 * Get user auth info data from user and org roles.
 */
async function getUserAuthInfo(user) {
  const organizationRoles = await models.OrganizationRole.findAll({
    where: { userId: user.id },
    include: [{ model: models.Organization, as: 'organization' }]
  });
  return {
    user: {
      id: user.id,
      email: user.email
    },
    organizations: organizationRoles.map(organizationRole => ({
      id: organizationRole.organization.id,
      name: organizationRole.organization.name,
      title: organizationRole.organization.title
    }))
  };
}

/**
 * Respond with the user info and orgs.
 */
async function respondWithUserAuthInfo(res, user) {
  const data = await getUserAuthInfo(user);
  res.status(200);
  res.json({ data: data });
}

/**
 * Check user credentials, and set an auth cookie if true.
 */
const loginRoute = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await models.User.find({ where: { email: email } });
  const matchHash = (user && user.passwordHash) || DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, matchHash);
  if (!isMatch) {
    res.status(401).send('');
    return;
  }
  // Login lasts for a week.
  const durationSecs = 86400 * 7;
  const jwt = createJwt(user, durationSecs);
  res.cookie(authMiddleware.AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    maxAge: durationSecs * 1000
  });
  await respondWithUserAuthInfo(res, user);
};

/**
 * Clear auth cookie.
 */
const logoutRoute = async (req, res) => {
  res.clearCookie(authMiddleware.AUTH_COOKIE_NAME);
  res.status(200).send('');
};

/**
 * Get information for logged-in user.
 */
const infoRoute = async (req, res) => {
  const token = await authMiddleware.tokenForReq(req);
  const user = token ? await models.User.findById(token.sub) : null;
  if (!user) {
    res.status(200);
    res.json({ data: null });
    return;
  }
  await respondWithUserAuthInfo(res, user);
};

module.exports = {
  loginRoute,
  logoutRoute,
  infoRoute
};
