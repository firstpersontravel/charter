const apn = require('apn');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const faye = require('faye');
const Sequelize = require('sequelize');
const twilio = require('twilio');

try {
  var envPath = '/var/apps/galaxy/shared/env';
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

for (var k in process.env) {
  if (ENV_DEFAULTS[process.env[k]] !== undefined) {
    env[k] = ENV_DEFAULTS[process.env[k]];
  } else {
    env[k] = process.env[k];
  }
}

const serverPort = process.env.SERVER_PORT || 8000;
const pubsubHost = process.env.PUBSUB_HOST_INTERNAL || 'http://localhost';
const logger = pino({ safe: true, base: {} });

// Configure database
const dbConfig = require('../config/config');
var database = new Sequelize(dbConfig[process.env.NODE_ENV || 'development']);

/**
 * Monkey patch issue causing deprecation warning when customizing allowNull
 * validation error. See https://github.com/sequelize/sequelize/issues/1500
 */
Sequelize.Validator.notNull = function (item) { return !this.isNull(item); };

// Configure push provider
function getApnProvider() {
  if (!env.APNS_ENABLED) {
    return null;
  }
  return new apn.Provider({
    token: {
      key: path.join(__dirname, '../..', env.APNS_TOKEN_PATH),
      keyId: env.APNS_KEY_ID,
      teamId: env.APNS_TEAM_ID
    },
    production: (env.APNS_SANDBOX === false)
  });
}
var apnProvider = getApnProvider();

// Configure twilio
function getTwilioClient() {
  if (!env.TWILIO_ENABLED) {
    return null;
  }
  return new twilio(env.TWILIO_SID, env.TWILIO_AUTHTOKEN);
}
var twilioClient = getTwilioClient();

const fayePath = `${pubsubHost}/pubsub`;
const fayeClient = new faye.Client(fayePath);

module.exports = {
  getApnProvider: () => apnProvider,
  serverPort: serverPort,
  env: env,
  database: database,
  logger: logger,
  getFayeClient: () => fayeClient,
  getTwilioClient: () => twilioClient
};
