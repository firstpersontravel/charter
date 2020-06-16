require('module-alias/register');

const apn = require('apn');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const pinoPretty = require('pino-pretty');
const faye = require('faye');
const Sentry = require('@sentry/node');
const Sequelize = require('sequelize');
const twilio = require('twilio');

const sequelizeReadonlyPlugin = require('./sequelize/readonly');

// Read config if on live environment
try {
  const envPath = `${__dirname}/../../env`;
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .forEach((line) => {
      const key = line.split('=')[0];
      const value = line.split('=')[1];
      process.env[key] = value;
    });
} catch (err) {
  // not on live
  // console.log('err', err);
}

const ENV_DEFAULTS = {true: true, false: false};
const env = {};

for (const k in process.env) {
  if (ENV_DEFAULTS[process.env[k]] !== undefined) {
    env[k] = ENV_DEFAULTS[process.env[k]];
  } else {
    env[k] = process.env[k];
  }
}

// Configure raven
Sentry.init({
  dsn: env.HQ_SENTRY_DSN,
  environment: env.HQ_SENTRY_ENVIRONMENT,
  release: env.GIT_HASH
});

const serverPort = process.env.HQ_SERVER_PORT || 8000;
const pubsubHost = process.env.HQ_PUBSUB_URL || 'http://localhost';
const logger = pino({
  prettyPrint: {
    levelFirst: true,
    colorize: true,
    translateTime: 'SYS:standard'
  },
  prettifier: pinoPretty,
  base: {}
});

// Configure database
const dbConfig = require('../config/config');
const environmentName = process.env.NODE_ENV || 'development';

let database = new Sequelize(dbConfig[environmentName]);

// Install read-only fields plugin
sequelizeReadonlyPlugin(database);

/**
 * Monkey patch issue causing deprecation warning when customizing allowNull
 * validation error. See https://github.com/sequelize/sequelize/issues/1500
 */
Sequelize.Validator.notNull = function (item) { return !this.isNull(item); };

// Configure push provider
function getApnProvider() {
  if (!env.HQ_APNS_ENABLED) {
    return null;
  }
  return new apn.Provider({
    token: {
      key: path.join(__dirname, '../..', env.HQ_APNS_TOKEN_PATH),
      keyId: env.HQ_APNS_KEY_ID,
      teamId: env.HQ_APNS_TEAM_ID
    },
    production: (env.HQ_APNS_SANDBOX === false)
  });
}
let apnProvider = getApnProvider();

// Configure Twilio
function getTwilioClient() {
  if (!env.HQ_TWILIO_ENABLED) {
    return null;
  }
  return new twilio(env.HQ_TWILIO_SID, env.HQ_TWILIO_AUTHTOKEN);
}
let twilioClient = getTwilioClient();

// Configure SendGrid
let sendgridClient = require('@sendgrid/mail');
sendgridClient.setApiKey(env.HQ_SENDGRID_KEY);

// Configure faye
const fayePath = `${pubsubHost}/pubsub`;
const fayeClient = new faye.Client(fayePath);

module.exports = {
  getApnProvider: () => apnProvider,
  serverPort: serverPort,
  env: env,
  database: database,
  logger: logger,
  getFayeClient: () => fayeClient,
  getTwilioClient: () => twilioClient,
  getSendgridClient: () => sendgridClient
};
