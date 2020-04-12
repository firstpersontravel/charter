const assert = require('assert');
const httpMocks = require('node-mocks-http');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const pageActorRoutes = require('../../src/routes/page_actor');

describe('pageActorRoutes', () => {
  describe('#actorsListRoute', () => {
    it('returns 200', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      sandbox.stub(models.Org, 'findOne').resolves({
        id: 1,
        name: 'org',
        title: 'Org'
      });

      // stub db response
      sandbox.stub(models.Player, 'findAll').resolves([{
        roleName: 'Gabe',
        user: { id: 10, firstName: 'g', lastName: 's' },
        trip: {
          script: {
            content: {
              roles: [{
                name: 'Gabe',
                type: 'performer'
              }]
            }
          }
        }
      }]);

      await pageActorRoutes.actorsListRoute(req, res);

      // Test found players with correct arguments
      sinon.assert.calledOnce(models.Player.findAll);
      assert.deepStrictEqual(models.Player.findAll.firstCall.args, [{
        where: { userId: { [Sequelize.Op.not]: null } },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false },
          include: [{ model: models.Script, as: 'script' }]
        }, {
          model: models.User,
          as: 'user'
        }, {
          model: models.Org,
          as: 'org',
          where: { id: 1 }
        }]
      }]);

      // Test rendered ok
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getRenderView(), 'actor/actors');
      assert.deepStrictEqual(res._getRenderData(), {
        layout: 'actor',
        orgName: 'org',
        orgTitle: 'Org',
        users: [{
          id: 10,
          firstName: 'g',
          lastName: 's'
        }]
      });
    });
  });

  describe('#playerShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });

  describe('#userShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });
});
