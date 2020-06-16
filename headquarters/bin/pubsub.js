const http = require('http');
const faye = require('faye');

// Start listening
const server = http.createServer();

// Create pubsub and attach to server
const bayeux = new faye.NodeAdapter({ mount: '/pubsub' });
bayeux.attach(server);

// Log on bayeux handshake
bayeux.on('handshake', function(clientId) {
  console.info(`Client connected: ${clientId}`);
});

const pubsubPort = process.env.HQ_PUBSUB_PORT || 8000;

try {
  server.listen(pubsubPort, function() {
    const host = server.address().address;
    const port = server.address().port;
    console.info(`pubsub listening at ${host}:${port}`);
  });
} catch(err) {
  console.error(err.message);
}
