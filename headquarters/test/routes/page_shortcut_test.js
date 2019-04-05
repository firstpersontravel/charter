const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const pageShortcutRoutes = require('../../src/routes/page_shortcut');

describe('pageShortcutRoutes', () => {
  describe('#playerShortcutRoute', () => {
    it('redirects', async () => {
      const req = httpMocks.createRequest({ params: { playerId: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      const mockPlayer = {
        userId: 10,
        tripId: 2,
        roleName: 'Phone'
      };
      sandbox.stub(models.Player, 'findByPk').resolves(mockPlayer);

      await pageShortcutRoutes.playerShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 302);
      assert.strictEqual(res._getRedirectUrl(), '/travel/u/10/p/2/role/Phone');

      // Test call made correctly
      sinon.assert.calledOnce(models.Player.findByPk);
      assert.deepEqual(models.Player.findByPk.firstCall.args, [1]);
    });

    it('returns 404 if player not found', async () => {
      const req = httpMocks.createRequest({ params: { playerId: 1 } });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(models.Player, 'findByPk').resolves(null);

      await pageShortcutRoutes.playerShortcutRoute(req, res);

      // Test redirect happens correctly
      assert.strictEqual(res.statusCode, 404);

      // Test call made correctly
      sinon.assert.calledOnce(models.Player.findByPk);
      assert.deepEqual(models.Player.findByPk.firstCall.args, [1]);
    });
  });

});
