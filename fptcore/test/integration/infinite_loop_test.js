const assert = require('assert');
const sinon = require('sinon');
const moment = require('moment');

const Kernel = require('../../src/kernel/kernel');

var sandbox = sinon.sandbox.create();

const now = moment.utc();

describe('Integration - Infinite Loop', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('messages only trigger triggers when conditionals match at start', () => {
    const actionContext = {
      scriptContent: {
        scenes: [
          { name: 'SCENE0' },
          { name: 'SCENE1' },
          { name: 'SCENE2' }
        ],
        triggers: [{
          name: 'trigger1',
          event: { type: 'scene_started', scene: 'SCENE1' },
          actions: [{ name: 'start_scene', scene_name: 'SCENE2' }]
        }, {
          name: 'trigger2',
          event: { type: 'scene_started', scene: 'SCENE2' },
          actions: [{ name: 'start_scene', scene_name: 'SCENE1' }]
        }]
      },
      evalContext: { tripState: { currentSceneName: 'SCENE0' } },
      evaluateAt: now
    };
    const action = { name: 'start_scene', params: { scene_name: 'SCENE1' } };
    const result = Kernel.resultForImmediateAction(action, actionContext);

    // Fires both events but doesn't infinite loop
    assert.deepStrictEqual(result.resultOps, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentPageNamesByRole: {},
          currentSceneName: 'SCENE1'
        }
      }
    }, {
      operation: 'event',
      event: { scene: 'SCENE1', type: 'scene_started' }
    }, {
      operation: 'updateTripHistory',
      history: { trigger1: now.toISOString() }
    }, {
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentPageNamesByRole: {},
          currentSceneName: 'SCENE2'
        }
      }
    }, {
      operation: 'event',
      event: { scene: 'SCENE2', type: 'scene_started' }
    }, {
      operation: 'updateTripHistory',
      history: { trigger2: now.toISOString() }
    }, {
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentPageNamesByRole: {},
          currentSceneName: 'SCENE1'
        }
      }
    }, {
      operation: 'event',
      event: { scene: 'SCENE1', type: 'scene_started' }
    }, {
      operation: 'updateTripHistory',
      history: { trigger2: now.toISOString() }
    }]);
  });
});
