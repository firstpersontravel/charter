require('module-alias/register');

/**
 * Named _init so mocha loads it first.
 */
const chalk = require('chalk');
const moment = require('moment');
const Sequelize = require('sequelize');

const config = require('../src/config.ts');
const mocks = require('./mocks');

// Set flag for consumption in app.
config.isTesting = true;
config.env.HQ_STAGE = 'test';
config.env.HQ_PUBLIC_URL = 'http://test';
config.env.HQ_TWILIO_HOST = 'http://twilio.test';
config.env.HQ_JWT_SECRET = 'test_secret';
config.env.HQ_CONTENT_BUCKET = 'test_bucket';

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
config.database = new Sequelize(require('../config/config.ts').test);

// Readonly plugin
const sequelizeReadonlyPlugin  = require('sequelize-noupdate-attributes');
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

// Show errors if failed with sequelize validation error
afterEach(function() {
  const err = this.currentTest.ctx._runnable.err;
  if (err && err instanceof Sequelize.ValidationError) {
    const errs = err.errors
      .map(errItem => (
        `- ${errItem.instance.constructor.name}.${errItem.path}: ` +
        `${errItem.message} (${errItem.type})`      
      ))
      .join('\n');
    console.log(chalk.red(`
------------------------------------------------
Sequelize Validation Error:
${errs}
------------------------------------------------`));
  }
});

afterEach(() => {
  // Destroy mocks
  mocks.teardownTestMocks();
  // reset DB
  return config.database.sync({ force: true });
});
