const assert = require('assert');
const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../../src/middleware/auth');
const config = require('../../src/config.ts');
const models = require('../../src/models');
const { sandbox, mockNow } = require('../mocks');

const goodPayload = { sub: 'user:1' };
const goodOpts = { algorithm: 'HS256', expiresIn: 600000 }; // 10 min
const mockUser = { id: 1 };

describe('authMiddleware', () => {
  describe('#authMiddleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = httpMocks.createRequest({});
      res = httpMocks.createResponse();
      next = sandbox.stub();
    });

    it('sets req.auth.user if valid token', async () => {
      const goodToken = jwt.sign(goodPayload, config.env.HQ_JWT_SECRET, goodOpts);
      req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${goodToken}` }
      });

      sandbox.stub(models.User, 'findByPk').resolves(mockUser);

      await authMiddleware.authMiddleware(req, res, next);

      // Test user set.
      assert.deepStrictEqual(req.auth, { type: 'user', user: mockUser });

      // Next should be called with no error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args, []);

      // Test user retrieved with right args.
      sinon.assert.calledWith(models.User.findByPk, 1, {
        include: [{ model: models.OrgRole, as: 'orgRoles' }]
      });
    });

    it('sets req.auth to null if no token', async () => {
      const mockUser = { id: 1 };
      sandbox.stub(models.User, 'findByPk').resolves(mockUser);

      await authMiddleware.authMiddleware(req, res, next);

      // Test user set.
      assert.strictEqual(req.auth, null);

      // Next should be called with no error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args, []);

      // Test user not retrieved
      sinon.assert.notCalled(models.User.findByPk);
    });

    it('returns error if token with invalid signature', async () => {
      const badToken = jwt.sign(goodPayload, 'badsecret', goodOpts);
      req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${badToken}` }
      });

      sandbox.stub(models.User, 'findByPk').resolves(mockUser);

      await authMiddleware.authMiddleware(req, res, next);

      // Next should be called with an error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args.length, 1);
      assert.deepStrictEqual(next.getCall(0).args[0].type, 'AuthenticationError');
      assert.deepStrictEqual(next.getCall(0).args[0].message, 'Invalid token');

      // Test user not retrieved
      sinon.assert.notCalled(models.User.findByPk);
    });

    it('returns error if token has expired', async () => {
      const expiredPayload = Object.assign({}, goodPayload, {
        exp: mockNow.clone().subtract(5, 'seconds').unix()
      });
      const expiredToken = jwt.sign(expiredPayload, config.env.HQ_JWT_SECRET,
        { algorithm: 'HS256' });
      req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${expiredToken}` }
      });

      sandbox.stub(models.User, 'findByPk').resolves(mockUser);

      await authMiddleware.authMiddleware(req, res, next);

      // Next should be called with an error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args.length, 1);
      assert.deepStrictEqual(next.getCall(0).args[0].type, 'AuthenticationError');
      assert.deepStrictEqual(next.getCall(0).args[0].message, 'Invalid token');

      // Test user not retrieved
      sinon.assert.notCalled(models.User.findByPk);
    });

    it('returns error if token is signed with bad algo', async () => {
      const expiredToken = jwt.sign(goodPayload, config.env.HQ_JWT_SECRET,
        { algorithm: 'none', expiresIn: 10 });
      req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${expiredToken}` }
      });

      sandbox.stub(models.User, 'findByPk').resolves(mockUser);

      await authMiddleware.authMiddleware(req, res, next);

      // Next should be called with an error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args.length, 1);
      assert.deepStrictEqual(next.getCall(0).args[0].type, 'AuthenticationError');
      assert.deepStrictEqual(next.getCall(0).args[0].message, 'Invalid token');

      // Test user not retrieved
      sinon.assert.notCalled(models.User.findByPk);
    });

    it('returns error if user is not found', async () => {
      const goodToken = jwt.sign(goodPayload, config.env.HQ_JWT_SECRET, goodOpts);
      req = httpMocks.createRequest({
        headers: { Authorization: `Bearer ${goodToken}` }
      });

      sandbox.stub(models.User, 'findByPk').resolves(null);

      await authMiddleware.authMiddleware(req, res, next);

      // Next should be called with an error.
      sinon.assert.calledOnce(next);
      assert.deepStrictEqual(next.getCall(0).args.length, 1);
      assert.deepStrictEqual(next.getCall(0).args[0].type, 'AuthenticationError');
      assert.deepStrictEqual(next.getCall(0).args[0].message, 'Invalid user');

      // Test user retrieved with right args.
      sinon.assert.calledWith(models.User.findByPk, 1, {
        include: [{ model: models.OrgRole, as: 'orgRoles' }]
      });
    });
  });
});
