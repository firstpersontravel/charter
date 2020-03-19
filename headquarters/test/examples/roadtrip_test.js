const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');

const models = require('../../src/models');
const KernelController = require('../../src/kernel/kernel');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/roadtrip.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('RoadTripExample', () => {

  let script;

  beforeEach(async () => {
    script = await TestUtil.createExample(example);
  });

  it('runs through road trip', async () => {
    const trip = await TestUtil.createDummyTripForScript(script);
    const driver = await models.Player.findOne({ where: { tripId: trip.id } });

    // Starts on starting page
    assert.strictEqual(driver.currentPageName, 'Start');

    // Start first drive
    await KernelController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-EMBARKED-1' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Drive1');

    // Finish first drive
    await KernelController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-ARRIVED-1' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Break');

    // Start second drive
    await KernelController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-EMBARKED-2' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Drive2');

    // Finish second drive
    await KernelController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-ARRIVED-2' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'End');
  });
});
