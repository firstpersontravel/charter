const assert = require('assert');
const httpMocks = require('node-mocks-http');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const models = require('../../src/models');
const pageActorRoutes = require('../../src/routes/page_actor');

const sandbox = sinon.sandbox.create();

describe('pageActorRoutes', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#actorsListRoute', () => {
    it('returns 200', async () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      // stub db response
      sandbox.stub(models.Participant, 'findAll').resolves([{
        roleName: 'Gabe',
        user: { id: 10 },
        trip: {
          script: {
            content: {
              roles: [{ name: 'Gabe', actor: true }]
            }
          }
        }
      }]);

      await pageActorRoutes.actorsListRoute(req, res);

      // Test found participants with correct arguments
      sinon.assert.calledOnce(models.Participant.findAll);
      assert.deepStrictEqual(models.Participant.findAll.firstCall.args, [{
        where: { userId: { [Sequelize.Op.not]: null } },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false },
          include: [{ model: models.Script, as: 'script' }]
        }, {
          model: models.User,
          as: 'user'
        }]
      }]);

      // Test rendered ok
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getRenderView(), 'actor/actors');
      assert.deepStrictEqual(res._getRenderData(), {
        layout: 'actor',
        users: [{ id: 10 }]
      });
    });
  });

  describe('#participantShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });

  describe('#userShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });
});
