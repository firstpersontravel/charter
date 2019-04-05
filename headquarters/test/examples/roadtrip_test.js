const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');

const models = require('../../src/models');
const TripActionController = require('../../src/controllers/trip_action');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/roadtrip.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('RoadTripExample', () => {

  let script;

  beforeEach(async () => {
    script = await TestUtil.createScriptWithContent(example);
  });

  it('runs through road trip', async () => {
    const trip = await TestUtil.createDummyTripForScript(script);
    const driver = await models.Player.findOne({ where: { tripId: trip.id } });

    // Starts on starting page
    assert.strictEqual(driver.currentPageName, 'Start');

    // Start first drive
    await TripActionController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-EMBARKED-1' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Drive1');

    // Finish first drive
    await TripActionController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-ARRIVED-1' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Break');

    // Start second drive
    await TripActionController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-EMBARKED-2' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'Drive2');

    // Finish second drive
    await TripActionController.applyAction(trip.id, {
      name: 'signal_cue',
      params: { cue_name: 'CUE-ARRIVED-2' }
    });

    // Get to next page
    await driver.reload();
    assert.strictEqual(driver.currentPageName, 'End');
  });
});
