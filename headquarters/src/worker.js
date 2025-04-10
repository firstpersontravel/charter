require('module-alias/register');

const moment = require('moment');
const Sentry = require('@sentry/node');
const Sequelize = require('sequelize');

const config = require('./config.ts');
const models = require('./models');
const { initTracing } = require('./sentry');
const RunnerWorker = require('./workers/runner');
const SchedulerWorker = require('./workers/scheduler');
const MaintenanceWorker = require('./workers/maintenance');

// Configure Sentry
Sentry.init({
  dsn: config.env.HQ_SENTRY_DSN,
  environment: config.env.HQ_SENTRY_ENVIRONMENT,
  release: config.env.GIT_HASH,
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0
});

initTracing(models);

const SCHEDULE_INTERVAL = 10000; // 10 secs
const RUN_INTERVAL = 1000; // sec
const MAINTENANCE_INTERVAL = 86400 * 1000;  // every day

let isRunningActions = false;
let isSchedulingActions = false;

function handleWorkerError(err) {
  // In case DB isn't booted or accessible
  if (err instanceof Sequelize.ConnectionError) {
    console.warn(`${err.name} accessing database, will try again.`);
    return;
  }
  // In case DB isn't migrated properly
  if (err instanceof Sequelize.DatabaseError) {
    console.warn(`${err.name} accessing database, will try again.`);
    return;
  }
  Sentry.captureException(err);
  console.error(`Uncaught exception: ${err.message}`);
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

    // Schedule actions up to now
    await SchedulerWorker.scheduleActions(moment.utc());
  } catch (err) {
    handleWorkerError(err);
  }
  isSchedulingActions = false;
}

async function runActions() {
  if (isRunningActions) {
    return;
  }
  isRunningActions = true;
  try {
    await RunnerWorker.runScheduledActions(moment.utc(), null, true);
  } catch (err) {
    handleWorkerError(err);
  }
  isRunningActions = false;
}

async function runMaintenance() {
  try {
    await MaintenanceWorker.runMaintenance();
  } catch (err) {
    handleWorkerError(err);
  }
}

function start() {
  setInterval(runActions, RUN_INTERVAL);
  setInterval(scheduleActions, SCHEDULE_INTERVAL);
  setInterval(runMaintenance, MAINTENANCE_INTERVAL);
}

module.exports = {
  start: start
};
