const assert = require('assert');

const ParticipantCore = require('../src/participant');

describe('ParticipantCore', () => {

  describe('#getInitialFields', () => {

    const script = {
      content: {
        pages: [{
          name: 'PAGE-1'
        }],
        roles: [{
          name: 'Sam',
          actor: false,
          starting_page: 'PAGE-1',
          initial_values: { carrots: 5 }
        }],
        variants: [
          { name: 'default' },
          { name: 'override', starting_pages: { Sam: 'PAGE-2' } }
        ]
      }
    };

    it('creates values from role', () => {
      const res = ParticipantCore
        .getInitialFields(script, 'Sam', []);
      assert.deepEqual(res, {
        currentPageName: 'PAGE-1',
        roleName: 'Sam',
        values: { carrots: 5 }
      });
    });

    it('creates values with overrides from template', () => {
      const res = ParticipantCore.getInitialFields(
        script, 'Sam', ['override']);
      assert.strictEqual(res.currentPageName, 'PAGE-2');
    });

  });

});
