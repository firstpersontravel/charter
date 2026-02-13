const assert = require('assert');

const start_scene = require('../../../src/modules/scenes/scene_start').default;

describe('#start_scene', () => {
  it('starts a scene', () => {
    const actionContext = {
      scriptContent: {
        scenes: [{ name: 'SCENE-1' }, { name: 'SCENE-2' }]
      },
      evalContext: {
        tripState: {
          currentSceneName: 'SCENE-1',
          currentPageNamesByRole: {}
        }
      }
    };

    const res = start_scene.getOps({ scene_name: 'SCENE-2' }, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE-2',
          currentPageNamesByRole: {}
        }
      }
    }, {
      operation: 'event',
      event: { type: 'scene_started', scene: 'SCENE-2' }
    }]);
  });

  it('sends player to first page on scene', () => {
    const actionContext = {
      scriptContent: {
        scenes: [{ name: 'SCENE-1' }, { name: 'SCENE-2' }],
        roles: [{ name: 'Tablet', interface: 'Tablet' }],
        interface: [{ name: 'Tablet' }],
        pages: [
          { name: 'PAGE-ONE', interface: 'Tablet', scene: 'SCENE-1' },
          { name: 'PAGE-TWO', interface: 'Tablet', scene: 'SCENE-2' }
        ]
      },
      evalContext: {
        tripState: {
          currentSceneName: 'SCENE-1',
          currentPageNamesByRole: { Tablet: 'PAGE-ONE' }
        }
      }
    };

    const res = start_scene.getOps({ scene_name: 'SCENE-2' }, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE-2',
          currentPageNamesByRole: { Tablet: 'PAGE-TWO' }
        }
      }
    }, {
      operation: 'event',
      event: { type: 'scene_started', scene: 'SCENE-2' }
    }]);
  });

  it('leaves page on old scene', () => {
    const actionContext = {
      scriptContent: {
        scenes: [{ name: 'SCENE-1' }, { name: 'SCENE-2' }],
        roles: [{ name: 'Tablet', interface: 'Tablet' }],
        interface: [{ name: 'Tablet' }],
        pages: [{ name: 'PAGE-ONE', interface: 'Tablet', scene: 'SCENE-1' }]
      },
      evalContext: {
        tripState: {
          currentSceneName: 'SCENE-1',
          currentPageNamesByRole: { Tablet: 'PAGE-ONE' }
        }
      }
    };

    const res = start_scene.getOps({ scene_name: 'SCENE-2' }, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE-2',
          currentPageNamesByRole: {}
        }
      }
    }, {
      operation: 'event',
      event: { type: 'scene_started', scene: 'SCENE-2' }
    }]);
  });

  it('does nothing if same scene', () => {
    const actionContext = {
      scriptContent: {
        scenes: [{ name: 'SCENE-1' }, { name: 'SCENE-2' }],
        roles: [{ name: 'Tablet' }],
        pages: []
      },
      evalContext: {
        tripState: {
          currentSceneName: 'SCENE-1',
          currentPageNamesByRole: {}
        }
      }
    };

    const res = start_scene.getOps({ scene_name: 'SCENE-1' }, actionContext);

    assert.deepStrictEqual(res, []);
  });

  it('does nothing if global scene', () => {
    const actionContext = {
      scriptContent: {
        scenes: [{ name: 'SCENE-1' }, { name: 'SCENE-2', global: true }],
        roles: [{ name: 'Tablet' }],
        pages: []
      },
      evalContext: {
        tripState: {
          currentSceneName: 'SCENE-1',
          currentPageNamesByRole: {}
        }
      }
    };

    const res = start_scene.getOps({ scene_name: 'SCENE-2' }, actionContext);

    assert.deepStrictEqual(res, []);
  });
});
