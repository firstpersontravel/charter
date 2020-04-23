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
      sinon.assert.calledWith(iteree.getCall(0), 'def',
        coreRegistry.resources.scene.properties.title,
        scriptContent.scenes[0], 'title');
      sinon.assert.calledWith(iteree.getCall(1), undefined,
        coreRegistry.resources.achievement.properties.title,
        scriptContent.achievements[0], 'title');
      sinon.assert.calledWith(iteree.getCall(2), 'yes',
        coreRegistry.resources.achievement.properties.titles.keys,
        scriptContent.achievements[0].titles, 'keys');
      sinon.assert.calledWith(iteree.getCall(3), '123',
        coreRegistry.resources.achievement.properties.titles.values,
        scriptContent.achievements[0].titles, 'yes');
    });
  });  
});
