const sinon = require('sinon');

const Registry = require('../../src/registry/registry');
const ScriptCore = require('../../src/cores/script');

describe('ScriptCore', () => {
  describe('#walkParams', () => {
    // it('walks if params', () => {
    //   const iteree = sinon.stub();
    //   const scriptContent = {
    //     scenes: [{
    //       name: 'abc',
    //       title: 'def',
    //       active_if: 'test1'
    //     }],
    //     achievements: [{
    //       test: 'test2'
    //     }],
    //     pages: [{
    //       panels: [{
    //         type: 'image',
    //         visible_if: 'test3'
    //       }]
    //     }],
    //     triggers: [{
    //       active_if: 'test4',
    //       actions: [{
    //         name: 'conditional',
    //         if: 'test5',
    //         elseifs: [{
    //           if: 'test6',
    //           actions: []
    //         }]
    //       }]
    //     }]
    //   };

    //   ScriptCore.walkParams(scriptContent, 'ifClause', iteree);

    //   sinon.assert.callCount(iteree, 6);
    //   sinon.assert.calledWith(iteree.getCall(0), 'test1',
    //     Registry.resources.scene.properties.active_if,
    //     scriptContent.scenes[0], 'active_if');
    //   sinon.assert.calledWith(iteree.getCall(1), 'test2',
    //     Registry.resources.achievement.properties.test,
    //     scriptContent.achievements[0], 'test');
    //   sinon.assert.calledWith(iteree.getCall(2), 'test3',
    //     panel.common.properties.visible_if,
    //     scriptContent.pages[0].panels[0], 'visible_if');  // panel common
    //   sinon.assert.calledWith(iteree.getCall(3), 'test4',
    //     Registry.resources.trigger.properties.active_if,
    //     scriptContent.triggers[0], 'active_if');
    //   sinon.assert.calledWith(iteree.getCall(4), 'test5',
    //     { required: true, type: 'component', component: 'conditions' },
    //     scriptContent.triggers[0].actions[0], 'if');
    //   sinon.assert.calledWith(iteree.getCall(5), 'test6',
    //     { type: 'component', component: 'conditions' },
    //     scriptContent.triggers[0].actions[0].elseifs[0], 'if');
    // });

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

  describe('#getResourceErrors', () => {
    it.skip('throws on invalid collection', () => {});
    it.skip('adds path to validation errors', () => {});
  });

  describe('#validateScriptContent', () => {
    it.skip('throws on invalid meta', () => {});
    it.skip('throws on non-array collection', () => {});
  });
});
