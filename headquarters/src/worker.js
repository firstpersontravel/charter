const moment = require('moment');
const Sentry = require('@sentry/node');

// Import for configuration
require('./config');

const RunnerWorker = require('./workers/runner');
const SchedulerWorker = require('./workers/scheduler');

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
    // Update scheduleAt times for any trip or script that was updated recently
    await SchedulerWorker.updateScheduleAts();

    // Schedule actions up to five minutes ahead of time
    const aMinuteAhead = moment.utc().clone().add(5, 'minutes');
    await SchedulerWorker.scheduleActions(aMinuteAhead);

    isSchedulingActions = false;
  } catch (err) {
    Sentry.captureException(err);
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
    await RunnerWorker.runScheduledActions(moment.utc(), null, true);
    isRunningActions = false;
  } catch (err) {
    Sentry.captureException(err);
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
