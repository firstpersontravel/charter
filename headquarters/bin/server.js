const http = require('http');
const moment = require('moment-timezone');
const faye = require('faye');

const app = require('../src/app');
const config = require('../src/config');
const models = require('../src/models');

async function init() {
  if (config.env.HQ_DATABASE_BOOTSTRAP && config.env.HQ_STAGE === 'development') {
    await tryBootstrappingDb();
  }
}

// try multiple times in dev if mysql is booting up
async function tryBootstrappingDb() {
  const numTries = 10;
  for (let i = 0; i < numTries; i++) {
    try {
      return await bootstrapDb();
    } catch (err) {
      console.log(`Error bootstrapping DB; waiting and retrying: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Create DB if doesn't exist.
async function bootstrapDb() {
  const queryInterface = config.database.getQueryInterface();
  const result = await queryInterface.sequelize.query('SHOW TABLES LIKE \'Users\';',
    { type: queryInterface.sequelize.QueryTypes.SELECT });
  if (result.length > 0) {
    // Db exists
    return;
  }
  config.logger.warn('Bootstrapping database');
  await config.database.sync({ force: true });
  await createFixtures();
}

// Create fixture user
async function createFixtures() {
  // Create fixture user
  const testOrg = await models.Org.create({
    createdAt: moment.utc(),
    name: 'test',
    title: 'Test'
  });
  const testUser = await models.User.create({
    createdAt: moment.utc(),
    firstName: 'Test',
    email: 'test@test.com',
    passwordHash: '$2b$10$.C2EN6n3oZw5o81EUDL3Z.0uAMrnaPf0U.COPfCFcuBzhCijSZ1g.' // test
  });
  await models.OrgRole.create({ orgId: testOrg.id, userId: testUser.id });
}

init()
  .then(() => {
    // Create server
    const server = http.createServer(app);

    // Ensure all inactive connections are terminated by the ALB, by setting this a few seconds
    // higher than the ALB idle timeout
    server.keepAliveTimeout = 65000;
    // Ensure the headersTimeout is set higher than the keepAliveTimeout due to this nodejs
    // regression bug: https://github.com/nodejs/node/issues/27363
    server.headersTimeout = 66000;

    // Create pubsub and attach to server
    const bayeux = new faye.NodeAdapter({ mount: '/pubsub' });
    bayeux.attach(server);

    // Log on bayeux handshake
    bayeux.on('handshake', function(clientId) {
      config.logger.info({ name: 'pubsub' }, `client connected: ${clientId}`);
    });

    // Start listening
    server.listen(config.serverPort, err => {
      if (err) {
        throw err;
      }
      const host = server.address().address;
      const port = server.address().port;
      config.logger.info({ name: 'server' }, `listening at ${host}:${port}`);
    });
  })
  .catch(err => {
    config.logger.error(err.message);
    process.exit(1);
  });