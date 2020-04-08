const assert = require('assert');

const PlayerCore = require('../../src/cores/player');

describe('PlayerCore', () => {
  describe('#getInitialFields', () => {
    const scriptContent = {
      pages: [{
        name: 'PAGE-1'
      }],
      roles: [{
        name: 'Sam',
        actor: false,
        starting_page: 'PAGE-1'
      }],
      variants: [
        { name: 'default' },
        { name: 'override', starting_pages: { Sam: 'PAGE-2' } }
      ]
    };

    it('creates values from role', () => {
      const res = PlayerCore.getInitialFields(scriptContent, 'Sam', []);
      assert.deepEqual(res, {
        currentPageName: 'PAGE-1',
        roleName: 'Sam',
        acknowledgedPageName: '',
        acknowledgedPageAt: null
      });
    });

    it('creates values with overrides from template', () => {
      const res = PlayerCore.getInitialFields(
        scriptContent, 'Sam', ['override']);
      assert.strictEqual(res.currentPageName, 'PAGE-2');
    });
  });
});
