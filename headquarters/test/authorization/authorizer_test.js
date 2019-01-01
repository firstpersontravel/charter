const assert = require('assert');

const Authorizer = require('../../src/authorization/authorizer');

describe('Authorizer', () => {
  describe('#subjectForReq', () => {
    it('returns default subject', () => {
      const authz = new Authorizer(null);

      const res = authz.subjectForReq(null);

      assert.deepStrictEqual(res, { isDesigner: true, name: 'default' });
    });
  });
});
