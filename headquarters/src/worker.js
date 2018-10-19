const moment = require('moment');

const GlobalController = require('./controllers/global');

let isRunning = false;

async function poll() {
  if (isRunning) {
    return;
  }
  isRunning = true;
  try {
    // Schedule actions up to a minute ahead of time
    const aMinuteAhead = moment.utc().clone().add(60, 'seconds');
    await GlobalController.scheduleActions(aMinuteAhead);
    // But only execute actions ready now.
    const now = moment.utc();
    await GlobalController.runScheduledActions(now, null, true);
    isRunning = false;
  } catch (err) {
    console.error(`Uncaught exception running worker: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

function start() {
  setInterval(poll, 1000);
}

module.exports = {
  start: start
};
