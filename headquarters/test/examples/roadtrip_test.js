const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');

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

    // Starts on starting page
    assert.strictEqual(trip.tripState.currentPageNamesByRole.Driver, 'Start');

    // Start first drive
    const startDriveButtonId = script.content.pages
      .find(p => p.name === 'Start')
      .panels
      .find(p => p.type === 'button')
      .id;
    await KernelController.applyEvent(trip.id, {
      type: 'button_pressed',
      button_id: startDriveButtonId
    });

    // Get to next page
    await trip.reload();
    assert.strictEqual(trip.tripState.currentPageNamesByRole.Driver, 'Drive1');

    // Finish first drive
    const finishDriveDirectionsId = script.content.pages
      .find(p => p.name === 'Drive1')
      .panels
      .find(p => p.type === 'directions')
      .id;
    await KernelController.applyEvent(trip.id, {
      type: 'directions_arrived',
      directions_id: finishDriveDirectionsId
    });

    // Get to next page
    await trip.reload();
    assert.strictEqual(trip.tripState.currentPageNamesByRole.Driver, 'Break');

    // Start second drive
    const nextDriveButtonId = script.content.pages
      .find(p => p.name === 'Break')
      .panels
      .find(p => p.type === 'button')
      .id;
    await KernelController.applyEvent(trip.id, {
      type: 'button_pressed',
      button_id: nextDriveButtonId
    });

    // Get to next page
    await trip.reload();
    assert.strictEqual(trip.tripState.currentPageNamesByRole.Driver, 'Drive2');

    // Finish second drive
    const finishNextDriveDirectionsId = script.content.pages
      .find(p => p.name === 'Drive2')
      .panels
      .find(p => p.type === 'directions')
      .id;
    await KernelController.applyEvent(trip.id, {
      type: 'directions_arrived',
      directions_id: finishNextDriveDirectionsId
    });

    // Get to next page
    await trip.reload();
    assert.strictEqual(trip.tripState.currentPageNamesByRole.Driver, 'End');
  });
});
