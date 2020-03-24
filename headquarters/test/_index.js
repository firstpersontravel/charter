require('module-alias/register');

/**
 * Named _init so mocha loads it first.
 */
const moment = require('moment');
const Sequelize = require('sequelize');

const config = require('../src/config');
const mocks = require('./mocks');

// Set flag for consumption in app.
config.isTesting = true;
config.env.STAGE = 'test';
config.env.APP_PUBLIC_URL = 'http://test';
config.env.PUBSUB_HOST_INTERNAL = 'http://testpubsub';
config.env.TWILIO_HOST = 'http://twilio.test';
config.env.TWILIO_MEDIA_HOST = 'http://twilio.media';
config.env.JWT_SECRET = 'test_secret';
config.env.S3_CONTENT_BUCKET = 'test_bucket';

// Disable logs in tests
if (!config.env.SHOW_TEST_LOGS) {
  config.logger.level = 'fatal';
}

moment.relativeTimeThreshold('ss', 1);
moment.relativeTimeThreshold('s', 60);

moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: '%d seconds',
    ss: '%d seconds',
    m:  'a minute',
    mm: '%d minutes',
    h:  'an hour',
    hh: '%d hours',
    d:  'a day',
    dd: '%d days',
    M:  'a month',
    MM: '%d months',
    y:  'a year',
    yy: '%d years'
  }
});

// SQLite database
config.database = new Sequelize(require('../config/config').test);

// Readonly plugin
const sequelizeReadonlyPlugin = require('../src/sequelize/readonly');
sequelizeReadonlyPlugin(config.database);

// Require models to make sure all are registered
require('../src/models');

before(() => {
  // Sync DB
  return config.database.sync({
    force: true,
    // logging: console.log
  });  
});

beforeEach(() => {
  // Create mocks
  mocks.createTestMocks();
});

afterEach(() => {
  // Destroy mocks
  mocks.teardownTestMocks();
  // reset DB
  return config.database.sync({ force: true });
});


