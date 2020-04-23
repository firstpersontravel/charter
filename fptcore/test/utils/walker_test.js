const sinon = require('sinon');

const Registry = require('../../src/registry/registry');
const Walker = require('../../src/utils/walker');

describe('Walker', () => {
  describe('#walkAllFields', () => {
    it('walks string params', () => {
      const walker = new Walker(Registry);
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
        Registry.resources.scene.properties.title,
        scriptContent.scenes[0], 'title');
      sinon.assert.calledWith(iteree.getCall(1), undefined,
        Registry.resources.achievement.properties.title,
        scriptContent.achievements[0], 'title');
      sinon.assert.calledWith(iteree.getCall(2), 'yes',
        Registry.resources.achievement.properties.titles.keys,
        scriptContent.achievements[0].titles, 'keys');
      sinon.assert.calledWith(iteree.getCall(3), '123',
        Registry.resources.achievement.properties.titles.values,
        scriptContent.achievements[0].titles, 'yes');
    });
  });  
});
