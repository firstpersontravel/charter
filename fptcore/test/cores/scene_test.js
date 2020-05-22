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
      const res = SceneCore.getStartingSceneName(scriptContent,
        { evalContext: {} });
      assert.strictEqual(res, '1');
    });

    it('does not return global scenes', () => {
      const scriptContent = {
        scenes: [{ name: '2', global: true }, { name: '1' }]
      };
      const res = SceneCore.getStartingSceneName(scriptContent,
        { evalContext: {} });
      assert.strictEqual(res, '1');
    });
  });
});
