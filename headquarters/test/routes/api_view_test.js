const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const KernelUtil = require('../../src/kernel/util');
const apiViewRoutes = require('../../src/routes/api_view');

describe('apiViewRoutes', () => {
  describe('#getPlayerViewRoute', () => {
    it('returns the current interface and page', async () => {
      const req = httpMocks.createRequest({
        params: { playerId: 100 }
      });
      const res = httpMocks.createResponse();

      const mockScriptContent = {
        roles: [{ name: 'P', interface: 'I' }],
        pages: [{
          name: 'page1',
          panels: [{
            type: 'button',
            text: 'Press this {{color}} button'
          }]
        }],
        interfaces: [{
          name: 'I',
          tabs: [{
            title: 'Main',
            panels: [{ type: 'current_page' }]
          }, {
            title: 'Other',
            panels: [{
              type: 'text',
              text: 'Hi, head here: {{destination}}'
            }]
          }]
        }]
      };
      const mockPlayer = models.Player.build({ tripId: 200, roleName: 'P' });
      const mockObjs = {
        script: models.Script.build({ content: mockScriptContent }),
        experience: models.Experience.build({ timezone: 'US/Pacific' }),
        trip: models.Trip.build({
          values: { color: 'red', destination: 'the pub' },
          tripState: {
            currentPageNamesByRole: { P: 'page1' },
          }
        })
      };

      sandbox.stub(models.Player, 'findByPk').resolves(mockPlayer);
      sandbox.stub(KernelUtil, 'getObjectsForTrip').resolves(mockObjs);

      await apiViewRoutes.getPlayerViewRoute(req, res);

      // Check response as expected
      const expected = {
        data: {
          interface: {
            tabs: [{
              title: 'Main',
              panels: [{
                text: 'Press this red button',
                type: 'button'
              }]
            }, {
              title: 'Other',
              panels: [{
                text: 'Hi, head here: the pub',
                type: 'text'
              }]
            }]
          }
        }
      };
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(res._getData()), expected);

      // Test player found
      sinon.assert.calledOnce(models.Player.findByPk);
      sinon.assert.calledWith(models.Player.findByPk, 100);
    });
  });
});
