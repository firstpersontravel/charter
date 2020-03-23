require('module-alias/register');

const moment = require('moment');
const Sentry = require('@sentry/node');
const Sequelize = require('sequelize');

// Import for configuration
require('./config');

const RunnerWorker = require('./workers/runner');
const SchedulerWorker = require('./workers/scheduler');

const SCHEDULE_INTERVAL = 10000;
const RUN_INTERVAL = 1000;

let isRunningActions = false;
let isSchedulingActions = false;

function handleWorkerError(err) {
  if (err instanceof Sequelize.ConnectionError) {
    console.warn(`${err.name} accessing database, will try again.`);
    return;
  }
  Sentry.captureException(err);
  console.error(`Uncaught exception running scheduler: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}

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
    handleWorkerError(err);
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
    handleWorkerError(err);
  }
}

function start() {
  setInterval(runActions, RUN_INTERVAL);
  setInterval(scheduleActions, SCHEDULE_INTERVAL);
}

module.exports = {
  start: start
};
