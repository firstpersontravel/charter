const assert = require('assert');

const PlayerCore = require('../../src/cores/player').default;

describe('PlayerCore', () => {
  describe('#getInitialFields', () => {
    const scriptContent = {
      roles: [{ name: 'Sam' }],
      variants: [{ name: 'default' }]
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
