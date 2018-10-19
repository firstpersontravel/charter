const moment = require('moment');

const GlobalController = require('./controllers/global');

let isRunningActions = false;
let isSchedulingActions = false;

async function scheduleActions() {
  if (isSchedulingActions) {
    return;
  }
  isSchedulingActions = true;
  try {
    // Schedule actions up to a minute ahead of time
    const aMinuteAhead = moment.utc().clone().add(60, 'seconds');
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
  setInterval(runActions, 1000);
  setInterval(scheduleActions, 60000);
}

module.exports = {
  start: start
};
