const moment = require('moment');

const GlobalController = require('./controllers/global');

let isRunning = false;

function poll() {
  if (isRunning) {
    return;
  }
  isRunning = true;
  GlobalController
    .runScheduledActions(moment.utc(), null, true)
    .then(() => { isRunning = false; })
    .catch((err) => {
      console.error(`Uncaught exception running worker: ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    });
}

function start() {
  setInterval(poll, 1000);
}

module.exports = {
  start: start
};
