const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const models = require('../../src/models');

const pagePublicRoutes = require('../../src/routes/page_public');

const sandbox = sinon.sandbox.create();

describe('pagePublicRoutes', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#homeRoute', () => {
    it('returns 200', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      await pagePublicRoutes.homeRoute(req, res);

      assert.strictEqual(res.statusCode, 200);
    });
  });

  describe('#participantShortcutRoute', () => {
    it('redirects', async () => {
      const req = httpMocks.createRequest({ params: { participantId: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      const mockParticipant = {
        userId: 10,
        tripId: 2,
        roleName: 'Phone'
      };
      sandbox.stub(models.Participant, 'findById').resolves(mockParticipant);

      await pagePublicRoutes.participantShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res._getRedirectUrl(), '/travel/u/10/p/2/role/Phone');

      // Test call made correctly
      sinon.assert.calledOnce(models.Participant.findById);
      assert.deepEqual(models.Participant.findById.firstCall.args, [1]);
    });

    it('returns 404 if participant not found', async () => {
      const req = httpMocks.createRequest({ params: { participantId: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(models.Participant, 'findById').resolves(null);

      await pagePublicRoutes.participantShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 404);

      // Test call made correctly
      sinon.assert.calledOnce(models.Participant.findById);
      assert.deepEqual(models.Participant.findById.firstCall.args, [1]);
    });
  });

});
