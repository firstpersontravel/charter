const assert = require('assert');
const sinon = require('sinon');

const SceneCore = require('../../src/cores/scene');

const sandbox = sinon.sandbox.create();

describe('SceneCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getStartingScene', () => {
    it('returns first scene by title', () => {
      const scriptContent = {
        scenes: [
          { title: 'ghi', name: '5' },
          { title: 'abc', name: '3' },
          { title: 'def', name: '1' }
        ]
      };
      const res = SceneCore.getStartingSceneName(scriptContent,
        { evalContext: {} });
      assert.strictEqual(res, '3');
    });

    it('returns first scene by name', () => {
      const scriptContent = {
        scenes: [
          { title: '', name: '5' },
          { title: '', name: '3' },
          { title: '', name: '1' }
        ]
      };
      const res = SceneCore.getStartingSceneName(scriptContent,
        { evalContext: {} });
      assert.strictEqual(res, '1');
    });

    it('does not return global scenes', () => {
      const scriptContent = {
        scenes: [
          { title: 'abc', name: '2', global: true },
          { title: 'def', name: '1' }
        ]
      };
      const res = SceneCore.getStartingSceneName(scriptContent,
        { evalContext: {} });
      assert.strictEqual(res, '1');
    });
  });
});
