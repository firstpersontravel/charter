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
        }]
      };

      walker.walkAllFields(scriptContent, 'string', iteree);

      sinon.assert.callCount(iteree, 1);
      assert.deepStrictEqual(iteree.getCall(0).args, [
        'scenes', scriptContent.scenes[0], 'def',
        coreRegistry.resources.scene.properties.title]);
    });
  });  
});
