const assert = require('assert');

const ScriptCore = require('../../src/cores/script');

describe('ScriptCore', () => {
  describe('#getResourceErrors', () => {
    it.skip('throws on invalid collection', () => {});
    it.skip('adds path to validation errors', () => {});
  });

  describe('#validateScriptContent', () => {
    it.skip('throws on invalid meta', () => {});
    it.skip('throws on non-array collection', () => {});

    it('returns error on duplicate panel names', () => {
      const scriptContent = {
        meta: { version: ScriptCore.CURRENT_VERSION },
        scenes: [{
          name: 's',
          title: 's'
        }],
        interfaces: [{
          name: 'i',
          title: 'i',
          type: 'simple',
          section: ''
        }],
        pages: [{
          name: 'p',
          scene: 's',
          interface: 'i',
          title: 'p',
          panels: [{
            id: 1,
            type: 'audio_foreground'
          }, {
            id: 2,
            type: 'audio_foreground'
          }]
        }],
        content_pages: [{
          name: 'cp',
          interface: 'i',
          section: 'test',
          title: 'i',
          panels: [{
            id: 3,
            type: 'text',
            text: 'hi'
          }, {
            id: 1,
            type: 'text',
            text: 'there'
          }]
        }]
      };

      assert.throws(() => {
        ScriptCore.validateScriptContent(scriptContent);
      }, {
        message: 'There was 1 error validating the following collections: content_pages.',
        fieldErrors: [{
          path: 'content_pages[name=cp]',
          collection: 'content_pages',
          message: 'Duplicate id in panels: 1'
        }]
      });
    });

    it('returns error on duplicate action names', () => {
      const scriptContent = {
        meta: { version: ScriptCore.CURRENT_VERSION },
        scenes: [{
          name: 's',
          title: 's'
        }],
        triggers: [{
          name: 't1',
          scene: 's',
          actions: [{
            id: 5,
            name: 'start_scene',
            scene_name: 's'
          }, {
            id: 2,
            name: 'start_scene',
            scene_name: 's'
          }]
        }, {
          name: 't2',
          scene: 's',
          actions: [{
            id: 3,
            name: 'start_scene',
            scene_name: 's'
          }, {
            id: 5,
            name: 'start_scene',
            scene_name: 's'
          }]
        }]
      };

      assert.throws(() => {
        ScriptCore.validateScriptContent(scriptContent);
      }, {
        message: 'There was 1 error validating the following collections: triggers.',
        fieldErrors: [{
          path: 'triggers[name=t2]',
          collection: 'triggers',
          message: 'Duplicate id in actions: 5'
        }]
      });
    });
  });
});
