const assert = require('assert');
const sinon = require('sinon');

const SceneCore = require('../../src/cores/scene');

const sandbox = sinon.sandbox.create();

describe('SceneCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getStartingScene', () => {
    it('returns first scene', () => {
      const scriptContent = {
        scenes: [{ name: '1' }]
      };
      const res = SceneCore.getStartingSceneName(scriptContent, {});
      assert.strictEqual(res, '1');
    });

    it('does not return global scenes', () => {
      const scriptContent = {
        scenes: [{ name: '2', global: true }, { name: '1' }]
      };
      const res = SceneCore.getStartingSceneName(scriptContent, {});
      assert.strictEqual(res, '1');
    });

    it('returns active conditional scene', () => {
      const scriptContent = {
        scenes: [
          { name: '1', active_if: { op: 'istrue', ref: 'v' } },
          { name: '2' }
        ]
      };
      const res = SceneCore.getStartingSceneName(scriptContent, { v: 1 });
      assert.strictEqual(res, '1');

      const res2 = SceneCore.getStartingSceneName(scriptContent, { v: 0 });
      assert.strictEqual(res2, '2');
    });
  });
});
