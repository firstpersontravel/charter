const assert = require('assert');
const sinon = require('sinon');

const models = require('../../src/models');
const TripsController = require('../../src/controllers/trips');

const sandbox = sinon.sandbox.create();

describe('TripsController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#createWithDefaults', () => {

    it('creates a trip and players', async () => {
      const stubScript = {
        id: 2,
        timezone: 'US/Pacific',
        content: {
          roles: [{
            name: 'fake',
            initial_values: { fakeValue: 1 }
          }],
          scenes: [{
            name: 'SCENE-MAIN'
          }],
          variants: [{
            name: 'default',
            values: { one: 1 },
            schedule: { startAt: '8:00am' }
          },
          {
            name: 'basic',
            values: { two: 2 },
            schedule: { basicIntro: '10:00am' }
          },
          {
            name: 'all_inclusive',
            values: { three: 3 },
            schedule: { allInclusiveIntro: '9:00am' }
          }]
        }
      };
      const stubGroup = {
        id: 1,
        scriptId: 2,
        date: '2018-01-01'
      };
      sandbox.stub(models.Group, 'findById').resolves(stubGroup);
      sandbox.stub(models.Script, 'findById').resolves(stubScript);
      sandbox.stub(models.Trip, 'create').resolves({ id: 3 });
      sandbox.stub(models.Player, 'create').resolves({ id: 4 });

      await TripsController.createWithDefaults(1, 'title', 'T1', ['basic']);
      sinon.assert.calledWith(models.Group.findById, 1);
      sinon.assert.calledWith(models.Script.findById, 2);
      sinon.assert.calledOnce(models.Trip.create);
      // Create trip
      assert.deepStrictEqual(
        models.Trip.create.firstCall.args[0], {
          date: '2018-01-01',
          currentSceneName: 'SCENE-MAIN',
          groupId: 1,
          schedule: {
            basicIntro: '2018-01-01T18:00:00.000Z',
            startAt: '2018-01-01T16:00:00.000Z'
          },
          departureName: 'T1',
          scriptId: 2,
          variantNames: 'basic',
          title: 'title',
          values: { one: 1, two: 2 }
        });
      // Create player
      sinon.assert.calledOnce(models.Player.create);
      assert.deepStrictEqual(
        models.Player.create.firstCall.args[0], {
          currentPageName: '',
          tripId: 3,
          roleName: 'fake',
          userId: null,
          values: { fakeValue: 1 }
        });
    });
  });
});
