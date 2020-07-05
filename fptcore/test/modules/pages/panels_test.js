const assert = require('assert');

const panels = require('../../../src/modules/pages/panels');

describe('panels', () => {
  describe('audio_foreground', () => {
    describe('#export', () => {
      it.skip('returns path of audio', () => {});
    });
  });


  describe('button', () => {
    describe('#export', () => {
      it('templates text', () => {
        const panel = { text: 'hi, {{val}}' };
        const actionContext = {
          evalContext: { val: 'player one' },
        };

        const res = panels.button.export(panel, actionContext);

        const expected = { text: 'hi, player one' };
        assert.deepStrictEqual(res, expected);
      });
    });
  });

  describe('choice', () => {
    describe('#export', () => {
      it.skip('templates text', () => {});
    });
  });

  describe('content_browse', () => {
    describe('#export', () => {
      it.skip('returns list of rendered subpages', () => {});
    });
  });

  describe('current_page', () => {
    describe('#export', () => {
      it.skip('returns null', () => {});
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
