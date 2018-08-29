var http = require('http');

var app = require('../src/app');
var config = require('../src/config');

// Start listening
var server = http.createServer(app);

try {
  server.listen(config.serverPort, function() {
    // var host = server.address().address;
    // var port = server.address().port;
    // config.logger.info({ name: 'server' }, `listening at ${host}:${port}`);
  });
} catch(err) {
  config.logger.error(err.message);
}
