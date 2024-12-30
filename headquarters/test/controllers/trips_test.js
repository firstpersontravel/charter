const assert = require('assert');
const sinon = require('sinon');

const { sandbox, mockNow } = require('../mocks');
const models = require('../../src/models');
const TripsController = require('../../src/controllers/trips');

describe('TripsController', () => {
  describe('#createTrip', () => {
    it('creates a trip and players', async () => {
      const stubExperience = {
        id: 3,
        orgId: 200,
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
      const stubTrip = {
        id: 3,
        experienceId: 3,
        orgId: 200
      };
      sandbox.stub(models.Experience, 'findByPk').resolves(stubExperience);
      sandbox.stub(models.Script, 'findOne').resolves(stubScript);
      sandbox.stub(models.Trip, 'create').resolves(stubTrip);
      sandbox.stub(models.Player, 'create').resolves({ id: 4 });

      await TripsController.createTrip(3, 'title', ['basic']);

      sinon.assert.calledWith(models.Experience.findByPk, 3);
      sinon.assert.calledWith(models.Script.findOne, {
        where: { experienceId: 3, isActive: true }
      });
      // Create trip
      sinon.assert.calledOnce(models.Trip.create);
      assert.deepStrictEqual(models.Trip.create.getCall(0).args[0], {
        createdAt: mockNow,
        updatedAt: mockNow,
        orgId: 200,
        date: mockNow.format('YYYY-MM-DD'),
        tripState: {
          currentSceneName: '',
          currentPageNamesByRole: {}
        },
        schedule: {
          basicIntro: `${mockNow.format('YYYY-MM-DD')}T18:00:00.000Z`,
          startAt: `${mockNow.format('YYYY-MM-DD')}T16:00:00.000Z`
        },
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
      sinon.assert.calledWith(models.Player.create.getCall(0), {
        orgId: 200,
        tripId: 3,
        experienceId: 3,
        roleName: 'fake',
        participantId: null,
        acknowledgedPageAt: null,
        acknowledgedPageName: ''
      });
    });
  });
});
