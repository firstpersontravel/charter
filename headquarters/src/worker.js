const moment = require('moment');

// Import for configuration
require('./config');

const GlobalController = require('./controllers/global');

const SCHEDULE_INTERVAL = 10000;
const RUN_INTERVAL = 1000;

let isRunningActions = false;
let isSchedulingActions = false;

async function scheduleActions() {
  if (isSchedulingActions) {
    return;
  }
  isSchedulingActions = true;
  try {
    // Schedule actions up to five minutes ahead of time
    const aMinuteAhead = moment.utc().clone().add(5, 'minutes');
    await GlobalController.scheduleActions(aMinuteAhead);
    isSchedulingActions = false;
  } catch (err) {
    console.error(`Uncaught exception running scheduler: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

async function runActions() {
  if (isRunningActions) {
    return;
  }
  isRunningActions = true;
  try {
    await GlobalController.runScheduledActions(moment.utc(), null, true);
    isRunningActions = false;
  } catch (err) {
    console.error(`Uncaught exception running worker: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

function start() {
  setInterval(runActions, RUN_INTERVAL);
  setInterval(scheduleActions, SCHEDULE_INTERVAL);
}

module.exports = {
  start: start
};
