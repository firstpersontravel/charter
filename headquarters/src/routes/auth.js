const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');
const authMiddleware = require('../middleware/auth');
const EmailController = require('../controllers/email');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function createToken(user, durationSecs) {
  const payload = { iss: 'fpt', sub: user.id, aud: 'web' };
  const opts = { expiresIn: durationSecs, algorithm: 'HS256' };
  const token = jwt.sign(payload, config.env.HQ_JWT_SECRET, opts);
  return token;
}

// Dummy hash of '12345'.
const DUMMY_HASH = '$2b$10$H2vj6CxZj7NgrAusLS2QdOi4VlyHfFA.oKzjEZlPE1m2CdF63WjcW';

function getUserName(user) {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.lastName) {
    return user.lastName;
  }
  return null;
}

/**
 * Get user auth info data from user and org roles.
 */
async function getUserAuthInfo(user, tokenString) {
  const orgRoles = await models.OrgRole.findAll({
    where: { userId: user.id },
    include: [{ model: models.Org, as: 'org' }]
  });
  return {
    jwt: tokenString,
    user: {
      id: user.id,
      email: user.email,
      fullName: getUserName(user)
    },
    orgs: orgRoles.map(orgRole => ({
      id: orgRole.org.id,
      name: orgRole.org.name,
      title: orgRole.org.title,
      isPersonal: orgRole.org.isPersonal
    }))
  };
}

// Login lasts for a week.
const SESSION_DURATION_SECS = 86400 * 7;

/**
 * Respond with the user info and orgs.
 */
async function respondWithUserAuthInfo(res, user, tokenString) {
  const data = await getUserAuthInfo(user, tokenString);
  res.status(200);
  res.json({ data: data });
}

async function findUser(email) {
  return await models.User.findOne({
    where: { email: email.toLowerCase() }
  });
}

/**
 * Check user credentials, and set an auth cookie if true.
 */
const loginRoute = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await findUser(email);
  const matchHash = (user && user.passwordHash) || DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, matchHash);
  if (!isMatch) {
    res.status(401).send('');
    return;
  }
  const tokenString = createToken(user, SESSION_DURATION_SECS);
  await respondWithUserAuthInfo(res, user, tokenString);
};

const signupRoute = async (req, res) => {
  const fullName = req.body.fullName;
  const email = req.body.email;
  const password = req.body.password;
  const orgTitle = req.body.orgTitle;
  const orgName = slugify(orgTitle);
  const existingUser = await findUser(email);
  if (existingUser) {
    res.status(422).json({
      error: 'A user with this email already exists.'
    });
    return;
  }
  const existingOrg = await models.Org.findOne({ where: { name: orgName } });
  if (existingOrg) {
    res.status(422).json({
      error: 'A workspace with this name already exists.'
    });
    return;
  }

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const org = await models.Org.create({ name: orgName, title: orgTitle });
  const pwHash = await bcrypt.hash(password, 10);
  const user = await models.User.create({
    firstName: firstName,
    lastName: lastName,
    email: email.toLowerCase(),
    passwordHash: pwHash
  });

  await models.OrgRole.create({
    orgId: org.id,
    userId: user.id,
    isAdmin: true
  });

  const tokenString = createToken(user, SESSION_DURATION_SECS);
  await respondWithUserAuthInfo(res, user, tokenString);
};

/**
 * Get information for logged-in user.
 */
const infoRoute = async (req, res) => {
  const tokenString = authMiddleware.tokenForReq(req);
  if (!tokenString) {
    res.status(200);
    res.json({ data: null });
    return;
  }
  let payload;
  try {
    payload = await jwt.verify(tokenString, config.env.HQ_JWT_SECRET);
  } catch (err) {
    res.status(401);
    res.json({ data: null, error: err.message });
    return;
  }
  const user = await models.User.findByPk(payload.sub);
  if (!user) {
    res.status(200);
    res.json({ data: null, error: 'User not found' });
    return;
  }
  // Refresh token string every time info is called.
  const newTokenString = createToken(user, SESSION_DURATION_SECS);
  await respondWithUserAuthInfo(res, user, newTokenString);
};

const RESET_PASSWORD_LINK_DURATION_MSEC = 86400 * 1000; // one day
const LOST_PASSWORD_FROM = 'charter@firstperson.travel';
const LOST_PASSWORD_SUBJECT = 'Reset your Charter password';
const LOST_PASSWORD_BODY = `
## Reset your Charter Password

Did you recently ask us to reset your password? If so, you can follow this link to create a new password for your account.

<link>

If not, you can just ignore this message.

Thank you!
–The Charter Team`;

const lostPasswordRoute = async (req, res) => {
  const email = req.body.email;
  const user = await findUser(email);
  if (!user) {
    res.status(200);
    res.json({ data: null });
    return;
  }
  const resetToken = crypto.randomBytes(16).toString('hex');
  const nowMsec = new Date().valueOf();
  const resetExpiry = new Date(nowMsec + RESET_PASSWORD_LINK_DURATION_MSEC);
  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpiry: resetExpiry
  });
  const resetLink = `${config.env.HQ_PUBLIC_URL}/reset-pw?token=${resetToken}`;
  const body = LOST_PASSWORD_BODY.replace('<link>', resetLink);
  await EmailController.sendEmail(LOST_PASSWORD_FROM, user.email,
    LOST_PASSWORD_SUBJECT, body);
  res.status(200);
  res.json({ data: null });
};

const resetPasswordRoute = async (req, res) => {
  const token = req.body.token;
  const newPassword = req.body.newPassword;
  const user = await models.User.findOne({
    where: {
      passwordResetToken: token,
      experienceId: null,
      passwordHash: { [Sequelize.Op.not]: '' }
    }
  });
  if (!user) {
    res.status(403);
    res.json({ error: 'That token is not valid.' });
    return;
  }
  if (new Date().valueOf() > user.passwordResetExpiry.valueOf()) {
    res.status(403);
    res.json({ error: 'That token has expired.' });
    return;
  }
  const pwHash = await bcrypt.hash(newPassword, 10);
  user.update({
    passwordHash: pwHash,
    passwordResetToken: '',
    passwordResetExpiry: null
  });
  res.status(200);
  res.json({ data: null });
};

module.exports = {
  loginRoute,
  signupRoute,
  lostPasswordRoute,
  resetPasswordRoute,
  infoRoute
};
