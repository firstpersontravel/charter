const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const pageShortcutRoutes = require('../../src/routes/page_shortcut');

describe('pageShortcutRoutes', () => {
  describe('#playerShortcutRoute', () => {
    it('redirects', async () => {
      const playerId = 1;
      const req = httpMocks.createRequest({ params: { playerId: playerId } });
      const res = httpMocks.createResponse();

      // Stub response
      const mockPlayer = {
        id: playerId,
        participantId: 10,
        tripId: 2,
        trip: { experienceId: 3 },
        roleName: 'Phone'
      };
      sandbox.stub(models.Player, 'findOne').resolves(mockPlayer);

      await pageShortcutRoutes.playerShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res._getRedirectUrl(), '/travel/u/10/p/2/p/1');

      // Test call made correctly
      sinon.assert.calledOnce(models.Player.findOne);
      assert.deepEqual(models.Player.findOne.firstCall.args, [{
        where: { id: playerId },
        include: [{ model: models.Trip, as: 'trip' }]
      }]);
    });

    it('returns 404 if player not found', async () => {
      const req = httpMocks.createRequest({ params: { playerId: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(models.Player, 'findOne').resolves(null);

      await pageShortcutRoutes.playerShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 404);

      // Test call made correctly
      sinon.assert.calledOnce(models.Player.findOne);
      assert.deepEqual(models.Player.findOne.firstCall.args, [{
        where: { id: 1 },
        include: [{ model: models.Trip, as: 'trip' }]
      }]);
    });
  });

});
