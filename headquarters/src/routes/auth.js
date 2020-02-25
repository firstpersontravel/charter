const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');
const authMiddleware = require('../middleware/auth');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

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
  const orgRoles = await models.OrgRole.findAll({
    where: { userId: user.id },
    include: [{ model: models.Org, as: 'org' }]
  });
  return {
    user: {
      id: user.id,
      email: user.email
    },
    orgs: orgRoles.map(orgRole => ({
      id: orgRole.org.id,
      name: orgRole.org.name,
      title: orgRole.org.title,
      isPersonal: orgRole.org.isPersonal
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

function setUserCookie(res, user) {
  // Login lasts for a week.
  const durationSecs = 86400 * 7;
  const jwt = createJwt(user, durationSecs);
  res.cookie(authMiddleware.AUTH_COOKIE_NAME, jwt, {
    httpOnly: true,
    maxAge: durationSecs * 1000
  });
}

/**
 * Check user credentials, and set an auth cookie if true.
 */
const loginRoute = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await models.User.findOne({
    where: {
      email: email,
      passwordHash: { [Sequelize.Op.not]: '' }
    }
  });
  const matchHash = (user && user.passwordHash) || DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, matchHash);
  if (!isMatch) {
    res.status(401).send('');
    return;
  }
  setUserCookie(res, user);
  await respondWithUserAuthInfo(res, user);
};

const signupRoute = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const orgTitle = req.body.orgTitle;
  const orgName = slugify(orgTitle);
  // Users w/no experienceId are loggin-able users
  const existingUser = await models.User.findOne({
    where: {
      email: email,
      experienceId: null,
      passwordHash: { [Sequelize.Op.not]: '' },
    }
  });
  if (existingUser) {
    res.status(422).send({
      error: 'A user with this email already exists.'
    });
    return;
  }
  const existingOrg = await models.Org.findOne({ where: { name: orgName } });
  if (existingOrg) {
    res.status(422).send({
      error: 'A workspace with this name already exists.'
    });
    return;
  }

  const org = await models.Org.create({ name: orgName, title: orgTitle });
  const pwHash = await bcrypt.hash(password, 10);
  const user = await models.User.create({
    email: email,
    orgId: org.id,
    experienceId: null,
    passwordHash: pwHash
  });

  await models.OrgRole.create({
    orgId: org.id,
    userId: user.id,
    isAdmin: true
  });

  setUserCookie(res, user);
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
  const user = token ? await models.User.findByPk(token.sub) : null;
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
  signupRoute,
  infoRoute
};
