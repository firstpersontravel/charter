const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const panels = require('fptcore/src/modules/pages/panels');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const ActionContext = require('../../src/kernel/action_context');
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
          directive: 'Page 1',
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
      const mockActionContext = {
        scriptContent: mockScriptContent,
        triggeringRoleName: 'P',
        _objs: {
          script: models.Script.build({ content: mockScriptContent }),
          experience: models.Experience.build({ timezone: 'US/Pacific' }),
          trip: models.Trip.build({
            values: { color: 'red', destination: 'the pub' },
            tripState: {
              currentPageNamesByRole: { P: 'page1' },
            }
          })
        }
      };

      sandbox.stub(panels.text, 'export').returns('__text__exported__');
      sandbox.stub(panels.button, 'export').returns('__button__exported__');

      sandbox.stub(models.Player, 'findByPk').resolves(mockPlayer);
      sandbox.stub(ActionContext, 'createForTripId').resolves(mockActionContext);

      await apiViewRoutes.getPlayerViewRoute(req, res);

      // Check response as expected
      const expected = {
        data: {
          interface: {
            headline: 'Page 1',
            style: {
              accent_color: '#666666',
              background_color: '#ffffff',
              custom_css: '',
              font_family: 'Raleway',
              primary_color: '#aa0000'
            },
            tabs: [{
              title: 'Main',
              panels: [{ type: 'button', data: '__button__exported__' }]
            }, {
              title: 'Other',
              panels: [{ type: 'text', data: '__text__exported__' }]
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
