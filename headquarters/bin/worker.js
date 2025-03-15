const config = require('../src/config.ts');
const worker = require('../src/worker');

worker.start();

config.logger.info({ name: 'worker' }, 'Worker started.');
