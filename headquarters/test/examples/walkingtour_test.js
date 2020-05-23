const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');
const moment = require('moment');

const models = require('../../src/models');
const KernelController = require('../../src/kernel/kernel');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/walkingtour.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('WalkingTourExample', () => {
  let script;
  let trip;
  let user;
  let player;

  beforeEach(async () => {
    script = await TestUtil.createExample(example);
    trip = await TestUtil.createDummyTripForScript(script);
    user = await models.User.create({
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      firstName: 'tester'
    });
    player = await models.Player.findOne({
      where: { tripId: trip.id, roleName: 'Player' },
      include: [{ model: models.User, as: 'user' }]
    });
    player.set({ userId: user.id });
    await player.save();
    await player.reload();
  });

  it('visits bon nene via geofence', async () => {
    // Visit Bon Nene
    await KernelController.applyEvent(trip.id, {
      type: 'geofence_entered',
      role: 'Player',
      geofence: 'GEOFENCE-BON-NENE'
    });

    // Test points awarded
    await trip.reload();
    assert.strictEqual(trip.values.points, 10);

    // Test message sent
    const messages = await models.Message.findAll({
      order: [['id', 'ASC']],
      where: { tripId: trip.id }
    });
    assert.strictEqual(messages.length, 1);
    assert.strictEqual(messages[0].content,
      'The mushroom spaghetti bowl is amazing.');
  });

  it('visits atlas via sending an image', async () => {
    const arriveAtAtlasDirectionsId = script.content.pages
      .find(p => p.name === 'PAGE-START')
      .panels
      .find(p => p.type === 'directions')
      .id;
    await KernelController.applyEvent(trip.id, {
      type: 'directions_arrived',
      directions_id: arriveAtAtlasDirectionsId
    });

    // Test message sent
    const messages1 = await models.Message.findAll({
      order: [['id', 'ASC']],
      where: { tripId: trip.id }
    });
    assert.strictEqual(messages1.length, 1);
    assert.strictEqual(messages1[0].content,
      'Welcome to Atlas Cafe! Send me an picture and i\'ll give you a sandwich recommendation.');

    // Send an image from somewhere else -- nothing should happen.
    await user.update({
      locationLatitude: 33.758273,
      locationLongitude: -121.411681,
      locationAccuracy: 40
    });

    await KernelController.applyAction(trip.id, {
      name: 'send_image',
      params: {
        from_role_name: 'Player',
        to_role_name: 'Guide',
        content: 'url',
      }
    });

    // Test nothing happens
    const messages2 = await models.Message.findAll({
      order: [['id', 'ASC']],
      where: { tripId: trip.id }
    });
    assert.strictEqual(messages2.length, 2);

    // Send an image from Atlas Cafe
    await user.update({
      locationLatitude: 37.759002,
      locationLongitude: -122.411496,
      locationAccuracy: 30
    });

    const now = moment.utc();
    await KernelController.applyAction(trip.id, {
      name: 'send_image',
      params: {
        from_role_name: 'Player',
        to_role_name: 'Guide',
        content: 'another_url'
      }
    }, now);

    // Test response message is scheduled in 10 sec
    const scheduledAction = await models.Action.findOne({
      order: [['id', 'ASC']],
      where: { tripId: trip.id, appliedAt: null }
    });
    assert(scheduledAction);
    assert.strictEqual(scheduledAction.type, 'action');
    assert.strictEqual(scheduledAction.name, 'send_text');
    assert.deepStrictEqual(scheduledAction.params, {
      from_role_name: 'Guide',
      to_role_name: 'Player',
      content: 'Try the trout sandwich.'
    });
    const tenSecFromNow = now.clone().add(10, 'seconds');
    assert(moment.utc(scheduledAction.scheduledAt).isSame(tenSecFromNow));
  });
});
