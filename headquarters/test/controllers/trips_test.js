const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const TripsController = require('../../src/controllers/trips');

describe('TripsController', () => {
  describe('#createTrip', () => {
    it('creates a trip and players', async () => {
      const stubExperience = {
        id: 3,
        timezone: 'US/Pacific',
      };
      const stubScript = {
        id: 2,
        content: {
          roles: [{ name: 'fake' }],
          scenes: [{
            name: 'SCENE-MAIN'
          }],
          variants: [{
            name: 'default',
            default: true,
            initial_values: { one: 1 },
            customizations: { oysters: 'omg' },
            schedule: { startAt: '8:00am' }
          },
          {
            name: 'basic',
            initial_values: { two: 2 },
            schedule: { basicIntro: '10:00am' }
          },
          {
            name: 'all_inclusive',
            initial_values: { three: 3 },
            schedule: { allInclusiveIntro: '9:00am' }
          }]
        }
      };
      const stubGroup = {
        id: 1,
        orgId: 200,
        date: '2018-01-01',
        script: stubScript,
        experience: stubExperience
      };
      sandbox.stub(models.Group, 'findOne').resolves(stubGroup);
      sandbox.stub(models.Trip, 'create').resolves({ id: 3, orgId: 200 });
      sandbox.stub(models.Player, 'create').resolves({ id: 4 });

      await TripsController.createTrip(1, 'title', 'T1', ['basic']);

      sinon.assert.calledWith(models.Group.findOne, {
        where: { id: 1 },
        include: [
          { model: models.Script, as: 'script' },
          { model: models.Experience, as: 'experience' }
        ]
      });
      sinon.assert.calledOnce(models.Trip.create);
      // Create trip
      assert.deepStrictEqual(
        models.Trip.create.firstCall.args[0], {
          orgId: 200,
          date: '2018-01-01',
          currentSceneName: 'SCENE-MAIN',
          groupId: 1,
          schedule: {
            basicIntro: '2018-01-01T18:00:00.000Z',
            startAt: '2018-01-01T16:00:00.000Z'
          },
          departureName: 'T1',
          scriptId: 2,
          experienceId: 3,
          variantNames: 'basic',
          customizations: { oysters: 'omg' },
          title: 'title',
          values: { one: 1, two: 2 },
          waypointOptions: {},
          history: {}
        });
      // Create player
      sinon.assert.calledOnce(models.Player.create);
      assert.deepStrictEqual(
        models.Player.create.firstCall.args[0], {
          orgId: 200,
          currentPageName: '',
          tripId: 3,
          roleName: 'fake',
          userId: null,
          acknowledgedPageAt: null,
          acknowledgedPageName: ''
        });
    });
  });
});
