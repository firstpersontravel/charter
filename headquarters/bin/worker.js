const config = require('../src/config');
const worker = require('../src/worker');

worker.start();

config.logger.info({ name: 'worker' }, 'Worker started.');
