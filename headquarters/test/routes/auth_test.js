const assert = require('assert');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const sinon = require('sinon');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const authMiddleware = require('../../src/middleware/auth');
const authRoutes = require('../../src/routes/auth');

const mockUser = {
  // Password hash for "i<3bunnies"
  passwordHash: '$2b$10$cdu9gygyP.sQCI.EhCR2neDtm9x/I.mJaqJxcpjGSPHRg77IphbB2'
};

describe('authRoutes', () => {
  let req;
  let res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  describe('#loginRoute', () => {
    it('sets a cookie if login is correct', async () => {
      sandbox.stub(models.User, 'find').resolves(mockUser);
      req.body = { email: 'gabe@test.com', password: 'i<3bunnies' };
      const now = moment.utc();

      await authRoutes.loginRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.cookies.fptauth.value);

      const tokenString = res.cookies.fptauth.value;
      const decoded = jwt.verify(tokenString, 'test_secret');

      assert.strictEqual(decoded.iss, 'fpt');
      assert.strictEqual(decoded.aud, 'web');
      // Issued at and expiration are in range
      assert(Math.abs(now.unix() - decoded.iat) < 2);
      assert(Math.abs(now.add(7, 'days').unix() - decoded.exp) < 2);

      // Test call made correctly
      sinon.assert.calledOnce(models.User.find);
      sinon.assert.calledWith(models.User.find, {
        where: {
          email: 'gabe@test.com',
          passwordHash: { [Sequelize.Op.not]: '' }
        }
      });
    });

    it('returns 401 if password is incorrect', async () => {
      sandbox.stub(models.User, 'find').resolves(mockUser);
      req.body = { email: 'gabe@test.com', password: 'deth2bunnies' };

      await authRoutes.loginRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.cookies.fptauth, undefined);

      // Test call made correctly
      sinon.assert.calledOnce(models.User.find);
      sinon.assert.calledWith(models.User.find, {
        where: { 
          email: 'gabe@test.com',
          passwordHash: { [Sequelize.Op.not]: '' }
        }
      });
    });

    it('returns 401 if user is not found', async () => {
      sandbox.stub(models.User, 'find').resolves(null);
      req.body = { email: 'gabe@test.com', password: 'deth2bunnies' };

      await authRoutes.loginRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.cookies.fptauth, undefined);
    });
  });

  describe('#logoutRoute', () => {
    it('clears cookie', async () => {
      sandbox.stub(res, 'clearCookie');

      await authRoutes.logoutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 200);
      sinon.assert.calledOnce(res.clearCookie);
      sinon.assert.calledWith(res.clearCookie, 'fptauth');
    });
  });

  describe('#infoRoute', () => {
    it('returns user and org info if logged in', async () => {
      const mockToken = { sub: 2 };
      const mockUser = { email: 'test@test.com' };
      const mockRoles = [{
        isAdmin: true,
        org: { name: 'name', title: 'title' }
      }];
      sandbox.stub(authMiddleware, 'tokenForReq').resolves(mockToken);
      sandbox.stub(models.User, 'findById').resolves(mockUser);
      sandbox.stub(models.OrgRole, 'findAll').resolves(mockRoles);

      await authRoutes.infoRoute(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          user: { email: 'test@test.com' },
          orgs: [{ name: 'name', title: 'title' }]
        }
      });
    });

    it('returns null info if not logged in', async () => {
      sandbox.stub(authMiddleware, 'tokenForReq').resolves(null);

      await authRoutes.infoRoute(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), { data: null });
    });
  });
});
