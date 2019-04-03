const sinon = require('sinon');

const ResourcesRegistry = require('../../src/registries/resources');
const ScriptCore = require('../../src/cores/script');

describe('ScriptCore', () => {
  describe('#walkParams', () => {
    it('walks if params', () => {
      const iteree = sinon.stub();
      const scriptContent = {
        scenes: [{
          name: 'abc',
          title: 'def',
          if: 'test1'
        }],
        achievements: [{
          test: 'test2'
        }],
        pages: [{
          panels: [{
            type: 'image',
            if: 'test3'
          }]
        }],
        triggers: [{
          if: 'test4',
          actions: [{
            name: 'conditional',
            if: 'test5',
            elseifs: [{
              if: 'test6',
              actions: []
            }]
          }]
        }]
      };

      ScriptCore.walkParams(scriptContent, 'ifClause', iteree);

      sinon.assert.callCount(iteree, 6);
      sinon.assert.calledWith(iteree.getCall(0), 'test1',
        ResourcesRegistry.scene.properties.if,
        scriptContent.scenes[0], 'if');
      sinon.assert.calledWith(iteree.getCall(1), 'test2',
        ResourcesRegistry.achievement.properties.test,
        scriptContent.achievements[0], 'test');
      sinon.assert.calledWith(iteree.getCall(2), 'test3',
        { type: 'ifClause' },
        scriptContent.pages[0].panels[0], 'if');  // panel common
      sinon.assert.calledWith(iteree.getCall(3), 'test4',
        ResourcesRegistry.trigger.properties.if,
        scriptContent.triggers[0], 'if');
      sinon.assert.calledWith(iteree.getCall(4), 'test5',
        { required: true, type: 'ifClause' },
        scriptContent.triggers[0].actions[0], 'if');
      sinon.assert.calledWith(iteree.getCall(5), 'test6',
        { type: 'ifClause' },
        scriptContent.triggers[0].actions[0].elseifs[0], 'if');
    });

    it('walks string params', () => {
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

      ScriptCore.walkParams(scriptContent, 'string', iteree);

      sinon.assert.callCount(iteree, 4);
      sinon.assert.calledWith(iteree.getCall(0), 'def',
        ResourcesRegistry.scene.properties.title,
        scriptContent.scenes[0], 'title');
      sinon.assert.calledWith(iteree.getCall(1), undefined,
        ResourcesRegistry.achievement.properties.title,
        scriptContent.achievements[0], 'title');
      sinon.assert.calledWith(iteree.getCall(2), 'yes',
        ResourcesRegistry.achievement.properties.titles.keys,
        scriptContent.achievements[0].titles, 'keys');
      sinon.assert.calledWith(iteree.getCall(3), '123',
        ResourcesRegistry.achievement.properties.titles.values,
        scriptContent.achievements[0].titles, 'yes');
    });
  });

  describe('#getResourceErrors', () => {
    it.skip('throws on invalid collection', () => {});
    it.skip('adds path to validation errors', () => {});
  });

  describe('#validateScriptContent', () => {
    it.skip('throws on invalid meta', () => {});
    it.skip('throws on non-array collection', () => {});
  });
});