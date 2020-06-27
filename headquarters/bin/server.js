const http = require('http');

const app = require('../src/app');
const config = require('../src/config');

// Start listening
const server = http.createServer(app);

try {
  server.listen(config.serverPort, function() {
    const host = server.address().address;
    const port = server.address().port;
    config.logger.info({ name: 'server' }, `listening at ${host}:${port}`);
  });
} catch(err) {
  config.logger.error(err.message);
}
