const assert = require('assert');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const sinon = require('sinon');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const authMiddleware = require('../../src/middleware/auth');
const authRoutes = require('../../src/routes/auth');
const EmailController = require('../../src/controllers/email');

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
    it('returns a token if login is correct', async () => {
      sandbox.stub(models.User, 'findOne').resolves(mockUser);
      req.body = { email: 'gabe@test.com', password: 'i<3bunnies' };
      const now = moment.utc();

      await authRoutes.loginRoute(req, res);

      // Test authentication happens correctly
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res._getData()).data;
      assert.ok(data.jwt);

      const tokenString = data.jwt;
      const decoded = jwt.verify(tokenString, 'test_secret');

      assert.strictEqual(decoded.iss, 'fpt');
      assert.strictEqual(decoded.aud, 'web');
      // Issued at and expiration are in range
      assert(Math.abs(now.unix() - decoded.iat) < 2);
      assert(Math.abs(now.add(7, 'days').unix() - decoded.exp) < 2);

      // Test call made correctly
      sinon.assert.calledOnce(models.User.findOne);
      sinon.assert.calledWith(models.User.findOne, {
        where: { email: 'gabe@test.com' }
      });
    });

    it('returns 401 if password is incorrect', async () => {
      sandbox.stub(models.User, 'findOne').resolves(mockUser);
      req.body = { email: 'gabe@test.com', password: 'deth2bunnies' };

      await authRoutes.loginRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.cookies.fptauth, undefined);

      // Test call made correctly
      sinon.assert.calledOnce(models.User.findOne);
      sinon.assert.calledWith(models.User.findOne, {
        where: { email: 'gabe@test.com' }
      });
    });

    it('returns 401 if user is not found', async () => {
      sandbox.stub(models.User, 'findOne').resolves(null);
      req.body = { email: 'gabe@test.com', password: 'deth2bunnies' };

      await authRoutes.loginRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.cookies.fptauth, undefined);
    });
  });

  describe('#signupRoute', () => {
    beforeEach(() => {
      sandbox.stub(models.Org, 'create').resolves({ id: 1 });
      sandbox.stub(models.User, 'create').resolves({ id: 2 });
      sandbox.stub(models.OrgRole, 'create').resolves({ id: 3 });
    });

    it('creates a new user and org', async () => {
      const now = moment.utc();
      sandbox.stub(models.User, 'findOne').resolves(null);
      sandbox.stub(models.Org, 'findOne').resolves(null);
      sandbox.stub(bcrypt, 'hash').resolves('123');
      req.body = {
        fullName: 'gabe test',
        email: 'GABE@TEST.COM',
        password: 'deth2bunnies',
        orgTitle: 'Doggos Heaven'
      };

      await authRoutes.signupRoute(req, res);

      // Test authentication happens correctly
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res._getData()).data;
      assert.ok(data.jwt);

      const tokenString = data.jwt;
      const decoded = jwt.verify(tokenString, 'test_secret');

      assert.strictEqual(decoded.iss, 'fpt');
      assert.strictEqual(decoded.aud, 'web');
      // Issued at and expiration are in range
      assert(Math.abs(now.unix() - decoded.iat) < 2);
      assert(Math.abs(now.add(7, 'days').unix() - decoded.exp) < 2);

      // Test finds were called
      sinon.assert.calledOnce(models.User.findOne);
      sinon.assert.calledWith(models.User.findOne, {
        where: { email: 'gabe@test.com' }
      });
      sinon.assert.calledOnce(models.Org.findOne);
      sinon.assert.calledWith(models.Org.findOne, {
        where: { name: 'doggos-heaven' }
      });

      // Test objects were created ok
      sinon.assert.calledOnce(models.Org.create);
      sinon.assert.calledWith(models.Org.create, {
        name: 'doggos-heaven',
        title: 'Doggos Heaven'
      });
      sinon.assert.calledOnce(models.User.create);
      sinon.assert.calledWith(models.User.create, {
        firstName: 'gabe',
        lastName: 'test',
        email: 'gabe@test.com',
        passwordHash: '123'
      });
      sinon.assert.calledOnce(models.OrgRole.create);
      sinon.assert.calledWith(models.OrgRole.create, {
        orgId: 1,
        userId: 2,
        isAdmin: true
      });
    });

    it('fails if a user with this email exists', async () => {
      sandbox.stub(models.User, 'findOne').resolves({ id: 3 });
      sandbox.stub(models.Org, 'findOne').resolves(null);
      req.body = {
        firstName: 'gabe',
        lastName: 'test',
        email: 'GaBE@TESt.CoM',
        password: 'deth2bunnies',
        orgTitle: 'Doggos Heaven'
      };

      await authRoutes.signupRoute(req, res);

      // Returns an error
      assert.strictEqual(res.statusCode, 422);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        error: 'A user with this email already exists.'
      });

      // Test nothing created
      sinon.assert.notCalled(models.Org.create);
      sinon.assert.notCalled(models.User.create);
      sinon.assert.notCalled(models.OrgRole.create);
    });

    it('fails if an org with the same name exists', async () => {
      sandbox.stub(models.User, 'findOne').resolves(null);
      sandbox.stub(models.Org, 'findOne').resolves({ id: 2 });
      req.body = {
        email: 'GaBE@TESt.CoM',
        password: 'deth2bunnies',
        orgTitle: 'Doggos Heaven'
      };

      await authRoutes.signupRoute(req, res);

      // Returns an error
      assert.strictEqual(res.statusCode, 422);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        error: 'A workspace with this name already exists.'
      });

      // Test nothing created
      sinon.assert.notCalled(models.Org.create);
      sinon.assert.notCalled(models.User.create);
      sinon.assert.notCalled(models.OrgRole.create);
    });
  });

  describe('#infoRoute', () => {
    it('returns user and org info if logged in', async () => {
      const mockToken = jwt.sign({ sub: 2 }, 'test_secret',
        { algorithm: 'HS256' });
      const mockUser = {
        firstName: 'gabe',
        lastName: 'test',
        email: 'test@test.com'
      };
      const mockRoles = [{
        isAdmin: true,
        org: { name: 'name', title: 'title' }
      }];
      sandbox.stub(authMiddleware, 'tokenForReq').returns(mockToken);
      sandbox.stub(models.User, 'findByPk').resolves(mockUser);
      sandbox.stub(models.OrgRole, 'findAll').resolves(mockRoles);
      sandbox.stub(jwt, 'sign').returns('mock_signed');

      await authRoutes.infoRoute(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: {
          jwt: 'mock_signed',
          user: { fullName: 'gabe test', email: 'test@test.com' },
          orgs: [{ name: 'name', title: 'title' }]
        }
      });
    });

    it('returns 401 on invalid token', async () => {
      const mockToken = jwt.sign({ sub: 2 }, 'bad', { algorithm: 'HS256' });
      sandbox.stub(authMiddleware, 'tokenForReq').returns(mockToken);

      await authRoutes.infoRoute(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        data: null,
        error: 'invalid signature'
      });
    });

    it('returns null info if not logged in', async () => {
      sandbox.stub(authMiddleware, 'tokenForReq').returns(null);

      await authRoutes.infoRoute(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), { data: null });
    });
  });

  describe('#lostPasswordRoute', () => {
    beforeEach(() => {
      sandbox.stub(EmailController, 'sendEmail').resolves();
    });

    it('sends email if user exists', async () => {
      const fakeUser = {
        email: 'abc@123.com',
        update: sandbox.stub().resolves(null)
      };
      sandbox.stub(models.User, 'findOne').resolves(fakeUser);
      sandbox.stub(crypto, 'randomBytes').returns(Buffer.from('abc', 'ascii'));
      req.body = { email: 'abc@123.com' };

      await authRoutes.lostPasswordRoute(req, res);

      // Returns ok
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), { data: null });

      // Sends email
      const now = new Date();
      const expectedBody = `
## Reset your Charter Password

Did you recently ask us to reset your password? If so, you can follow this link to create a new password for your account.

http://test/reset-pw?token=616263

If not, you can just ignore this message.

Thank you!
–The Charter Team`;
      sinon.assert.calledOnce(EmailController.sendEmail);
      sinon.assert.calledWith(EmailController.sendEmail,
        'charter@firstperson.travel', 'abc@123.com',
        'Reset your Charter password', expectedBody);

      // Updates user
      sinon.assert.calledOnce(fakeUser.update);
      assert.strictEqual(
        fakeUser.update.getCall(0).args[0].passwordResetToken, '616263');
      assert.strictEqual(
        Math.floor(fakeUser.update.getCall(0).args[0].passwordResetExpiry.valueOf() / 1000),
        Math.floor((now.valueOf() + 86400 * 1000) / 1000)
      );
    });

    it('returns ok if user does not exist', async () => {
      sandbox.stub(models.User, 'findOne').resolves(null);
      req.body = { email: 'abc@123.com' };

      await authRoutes.lostPasswordRoute(req, res);

      // Returns ok
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), { data: null });

      // No updates
      sinon.assert.notCalled(EmailController.sendEmail);
    });
  });

  describe('#resetPasswordRoute', () => {
    it('resets password for user matching token', async () => {
      const fakeUser = {
        update: sandbox.stub(),
        // Expires in 40 minutes
        passwordResetExpiry: new Date(new Date().valueOf() + 40 * 60000)
      };
      sandbox.stub(bcrypt, 'hash').resolves('fakehash');
      sandbox.stub(models.User, 'findOne').resolves(fakeUser);
      req.body = { token: '123', newPassword: '456' };

      await authRoutes.resetPasswordRoute(req, res);

      // Returns ok
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), { data: null });

      // Find user properly
      sinon.assert.calledOnce(models.User.findOne);
      sinon.assert.calledWith(models.User.findOne, {
        where: {
          passwordResetToken: '123',
          experienceId: null,
          passwordHash: { [Sequelize.Op.not]: '' }
        }
      });      

      // Resets password
      sinon.assert.calledOnce(fakeUser.update);
      sinon.assert.calledWith(fakeUser.update, {
        passwordHash: 'fakehash',
        passwordResetToken: '',
        passwordResetExpiry: null
      });
    });

    it('fails if no user was found for token', async () => {
      sandbox.stub(models.User, 'findOne').resolves(null);
      req.body = { token: '123', newPassword: '456' };

      await authRoutes.resetPasswordRoute(req, res);

      // Returns an error
      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        error: 'That token is not valid.'
      });
    });

    it('fails if token has expired', async () => {
      const fakeUser = {
        update: sandbox.stub(),
        // Expires an hour ago
        passwordResetExpiry: new Date(new Date().valueOf() - 60000)
      };
      sandbox.stub(models.User, 'findOne').resolves(fakeUser);
      req.body = { token: '123', newPassword: '456' };

      await authRoutes.resetPasswordRoute(req, res);

      // Returns an error
      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(JSON.parse(res._getData()), {
        error: 'That token has expired.'
      });

      // Does not reset password
      sinon.assert.notCalled(fakeUser.update);
    });
  });
});
