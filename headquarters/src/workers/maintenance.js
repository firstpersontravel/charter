const twilioUtil = require('../handlers/twilio_util');

class MaintenanceWorker {
  static async runMaintenance() {
    await twilioUtil.pruneNumbers({
      deleteRelays: true,
      deleteNumbers: true,
      updateHosts: false,
      limit: 10,
      cullThreshold: 30
    });
  }
}

module.exports = MaintenanceWorker;