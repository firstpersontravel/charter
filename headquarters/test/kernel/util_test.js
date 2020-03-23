const sinon = require('sinon');
const assert = require('assert');

const ContextCore = require('fptcore/src/cores/context');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const KernelUtil = require('../../src/kernel/util');

describe('KernelUtil', () => {
  describe('#getObjectsForTrip', () => {
    it.skip('gets all needed objects for a trip', () => {});
  });

  describe('#prepareEvalContext', () => {
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
          currentSceneName: 'SCENE-1',
          schedule: { 'TIME-1': 'time' },
          history: { 'CUE-1': 'time' },
          waypointOptions: { 'WAYPOINT-1': 'OPTION-2' }
        }),
        players: [models.Player.build({
          roleName: 'Role',
          id: 123,
          currentPageName: 'PAGE-1'
        })]
      };

      const res = KernelUtil.prepareEvalContext(objs);

      sinon.assert.calledOnce(ContextCore.gatherEvalContext);

      const expectedEnv = { host: 'https://test.x.com' };
      const expectedTrip = {
        currentSceneName: 'SCENE-1',
        customizations: {},
        date: '01-01-2015',
        departureName: '',
        galleryName: '',
        history: {
          'CUE-1': 'time'
        },
        id: null,
        isArchived: false,
        players: [{
          acknowledgedPageName: '',
          currentPageName: 'PAGE-1',
          id: 123,
          roleName: 'Role',
          user: null
        }],
        schedule: {
          'TIME-1': 'time'
        },
        script: {
          content: {
            pages: [{
              directive: 'Go to the mall.',
              name: 'PAGE-1'
            }]
          },
          id: null,
          isActive: false,
          isArchived: false,
          isLocked: false
        },
        title: '',
        values: {},
        variantNames: '',
        waypointOptions: {
          'WAYPOINT-1': 'OPTION-2'
        }
      };
      assert.deepStrictEqual(ContextCore.gatherEvalContext.firstCall.args, [
        expectedEnv, expectedTrip]);

      assert.deepStrictEqual(res, sentinel);
    });
  });
});
