const assert = require('assert');
const moment = require('moment-timezone');
const sinon = require('sinon');

const models = require('../../src/models');
const TripsController = require('../../src/controllers/trips');

const sandbox = sinon.sandbox.create();

describe('TripsController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#createWithDefaults', () => {

    it('creates a playthrough and participants', async () => {
      const today = moment.utc().format('YYYY-MM-DD');
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
        date: today
      };
      sandbox.stub(models.Group, 'findById').resolves(stubGroup);
      sandbox.stub(models.Script, 'findById').resolves(stubScript);
      sandbox.stub(models.Playthrough, 'create').resolves({ id: 3 });
      sandbox.stub(models.Participant, 'create').resolves({ id: 4 });

      await TripsController.createWithDefaults(1, 'title', 'T1', ['basic']);
      sinon.assert.calledWith(models.Group.findById, 1);
      sinon.assert.calledWith(models.Script.findById, 2);
      sinon.assert.calledOnce(models.Playthrough.create);
      // Create playthrough
      assert.deepStrictEqual(
        models.Playthrough.create.firstCall.args[0], {
          date: today,
          currentSceneName: 'SCENE-MAIN',
          groupId: 1,
          schedule: {
            basicIntro: `${today}T17:00:00.000Z`,
            startAt: `${today}T15:00:00.000Z`
          },
          departureName: 'T1',
          scriptId: 2,
          variantNames: 'basic',
          title: 'title',
          values: { one: 1, two: 2 }
        });
      // Create participant
      sinon.assert.calledOnce(models.Participant.create);
      assert.deepStrictEqual(
        models.Participant.create.firstCall.args[0], {
          currentPageName: '',
          playthroughId: 3,
          roleName: 'fake',
          userId: null,
          values: { fakeValue: 1 }
        });
    });
  });
});
