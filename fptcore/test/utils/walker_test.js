const assert = require('assert');
const sinon = require('sinon');

const coreRegistry = require('../../src/core-registry');
const Walker = require('../../src/utils/walker');

describe('Walker', () => {
  describe('#walkAllFields', () => {
    it('walks string params', () => {
      const walker = new Walker(coreRegistry);
      const iteree = sinon.stub();
      const scriptContent = {
        scenes: [{
          name: 'abc',
          title: 'def'
        }],
        achievements: [{
          titles: {
            yes: '123'
          }
        }]
      };

      walker.walkAllFields(scriptContent, 'string', iteree);

      sinon.assert.callCount(iteree, 4);
      assert.deepStrictEqual(iteree.getCall(0).args, [
        'scenes', scriptContent.scenes[0], 'def',
        coreRegistry.resources.scene.properties.title]);
      assert.deepStrictEqual(iteree.getCall(1).args, [
        'achievements', scriptContent.achievements[0], undefined,
        coreRegistry.resources.achievement.properties.title]);
      assert.deepStrictEqual(iteree.getCall(2).args, [
        'achievements', scriptContent.achievements[0], 'yes',
        coreRegistry.resources.achievement.properties.titles.keys]);
      assert.deepStrictEqual(iteree.getCall(3).args, [
        'achievements', scriptContent.achievements[0], '123',
        coreRegistry.resources.achievement.properties.titles.values]);
    });
  });  
});
