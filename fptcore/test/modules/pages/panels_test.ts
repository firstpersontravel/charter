const assert = require('assert');
const sinon = require('sinon');

const panels = require('../../../src/modules/pages/panels');

describe('panels', () => {
  describe('audio_foreground', () => {
    describe('#export', () => {
      it('returns path of audio', () => {
        const actionContext = {};
        const panel = { audio: 'file.mp3' };

        const res = panels.audio_foreground.export(panel, actionContext);

        assert.deepStrictEqual(res, { audio: 'file.mp3' });
      });
    });
  });

  describe('button', () => {
    describe('#export', () => {
      it('templates text', () => {
        const panel = { text: 'hi, {{val}}' };
        const actionContext = { templateText: sinon.stub().returns('templated') };

        const res = panels.button.export(panel, actionContext);

        // Test result as expected
        const expected = { text: 'templated' };
        assert.deepStrictEqual(res, expected);

        // Test template called with text
        sinon.assert.calledWith(actionContext.templateText, panel.text);
      });
    });
  });

  describe('choice', () => {
    describe('#export', () => {
      it('templates text', () => {
        const panel = {
          text: 'hi, {{val}}',
          value_ref: 'varname',
          choices: [{ value: 'hi', text: 'hi' }]
        };
        const actionContext = { templateText: sinon.stub().returns('templated') };

        const res = panels.choice.export(panel, actionContext);

        // Test value as expected
        const expected = {
          text: 'templated',
          value_ref: 'varname',
          choices: [{ value: 'hi', text: 'hi' }]
        };
        assert.deepStrictEqual(res, expected);

        // Test template called with text
        sinon.assert.calledWith(actionContext.templateText, panel.text);
      });
    });
  });

  describe('content_browse', () => {
    describe('#export', () => {
      it('returns list of rendered subpages', () => {
        const panel = {
          title: 'Dossiers',
          section: 'dossiers',
        };
        const actionContext = {
          if: (ifStatement) => ifStatement !== 'false',
          registry: {
            panels: {
              special: {
                export(panel, actionContext) {
                  return null;
                }
              }
            }
          },
          scriptContent: {
            content_pages: [{
              section: 'dossiers',
              panels: [{ type: 'special' }]
            }, {
              section: 'other'
            }, {
              section: 'dossiers',
              visible_if: 'false',
              panels: []
            }]
          }
        };

        const res = panels.content_browse.export(panel, actionContext);

        // Test value as expected
        const expected = {
          subpages: [{
            panels: [{ type: 'special', data: null }]
          }]
        };
        assert.deepStrictEqual(res, expected);
      });
    });
  });

  describe('current_page', () => {
    describe('#export', () => {
      it('returns null', () => {
        const res = panels.current_page.export({}, {});

        assert.strictEqual(res, null);
      });
    });
  });

  describe('directions', () => {
    describe('#export', () => {
      it.skip('returns directions based on waypoint options', () => {});
    });
  });

  describe('image', () => {
    describe('#export', () => {
      it.skip('returns path of image', () => {});
    });
  });

  describe('messages_browse', () => {
    describe('#export', () => {
      it.skip('returns list of messages', () => {});
    });
  });

  describe('messages', () => {
    describe('#export', () => {
      it.skip('returns all messages', () => {});
    });
  });

  describe('numberpad', () => {
    describe('#export', () => {
      it.skip('templates text', () => {});
    });
  });

  describe('text', () => {
    describe('#export', () => {
      it.skip('templates text', () => {});
    });
  });

  describe('text_entry', () => {
    describe('#export', () => {
      it.skip('templates text', () => {});
    });
  });

  describe('video', () => {
    describe('#export', () => {
      it.skip('returns path of video', () => {});
    });
  });

  describe('yesno', () => {
    describe('#export', () => {
      it.skip('templates text', () => {});
    });
  });
});
