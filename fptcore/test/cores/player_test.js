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
        { name: 'default' }
      ]
    };

    it('creates values from role', () => {
      const res = PlayerCore.getInitialFields(scriptContent, 'Sam', []);
      assert.deepStrictEqual(res, {
        roleName: 'Sam',
        acknowledgedPageName: '',
        acknowledgedPageAt: null
      });
    });
  });
});
