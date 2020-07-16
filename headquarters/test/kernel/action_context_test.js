const sinon = require('sinon');
const assert = require('assert');

const ContextCore = require('fptcore/src/cores/context');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const ActionContext = require('../../src/kernel/action_context');

describe('ActionContext', () => {
  describe('#getObjectsForTrip', () => {
    it.skip('gets all needed objects for a trip', () => {});
  });

  describe('#_prepareEvalContext', () => {
    it('creates trip context', () => {
      const sentinel = 'abc';
      sandbox.stub(ContextCore, 'gatherEvalContext').returns(sentinel);

      const objs = {
        experience: {
          domain: 'https://test.x.com'
        },
        script: models.Script.build({
          content: {
            pages: [{
              name: 'PAGE-1',
              directive: 'Go to the mall.'
            }]
          }
        }),
        trip: models.Trip.build({
          date: '01-01-2015',
          tripState: {
            currentSceneName: 'SCENE-1',
            currentPageNamesByRole: { Role: 'PAGE-1' }
          },
          schedule: { 'TIME-1': 'time' },
          history: { 'CUE-1': 'time' },
          waypointOptions: { 'WAYPOINT-1': 'OPTION-2' }
        }),
        players: [models.Player.build({
          roleName: 'Role',
          id: 123
        })]
      };

      const res = ActionContext._prepareEvalContext(objs);

      sinon.assert.calledOnce(ContextCore.gatherEvalContext);

      const expectedEnv = { host: 'https://test.x.com' };
      const expectedTrip = {
        tripState: objs.trip.tripState,
        customizations: {},
        date: '01-01-2015',
        galleryName: '',
        history: objs.trip.history,
        id: null,
        isArchived: false,
        players: [{
          acknowledgedPageName: '',
          id: 123,
          roleName: 'Role',
          participant: null
        }],
        schedule: objs.trip.schedule,
        script: objs.script.get({ plain: true }),
        title: '',
        values: {},
        variantNames: '',
        waypointOptions: objs.trip.waypointOptions
      };
      assert.deepStrictEqual(ContextCore.gatherEvalContext.firstCall.args, [
        expectedEnv, expectedTrip]);

      assert.deepStrictEqual(res, sentinel);
    });
  });
});
