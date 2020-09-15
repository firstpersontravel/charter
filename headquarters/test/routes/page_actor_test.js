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

      sandbox.stub(models.Org, 'findOne')
        .resolves({ id: 1, name: 'org', title: 'Org' });

      // stub db response
      sandbox.stub(models.Player, 'findAll').resolves([{
        roleName: 'Gabe',
        participant: { id: 10, name: 'g s' },
        trip: {
          script: {
            content: {
              roles: [
                { name: 'Bob', title: 'Staff Bob' },
                { name: 'Gabe', title: 'Actor Gabe', interface: 'g' },
                { name: 'Ted', title: 'Player Ted', interface: 't' }
              ],
              interfaces: [
                { name: 'g', performer: true },
                { name: 't', performer: false }
              ]
            }
          },
          experience: { title: 'Amazing Adventure' },
          group: { date: '2020-03-03', }
        }
      }]);

      await pageActorRoutes.actorsListRoute(req, res);

      // Test found players with correct arguments
      sinon.assert.calledOnce(models.Player.findAll);
      assert.deepStrictEqual(models.Player.findAll.firstCall.args, [{
        where: { participantId: { [Sequelize.Op.not]: null } },
        include: [{
          model: models.Trip,
          as: 'trip',
          where: { isArchived: false },
          include: [
            { model: models.Script, as: 'script' },
            { model: models.Experience, as: 'experience' },
            { model: models.Group, as: 'group' }
          ]
        }, {
          model: models.Participant,
          as: 'participant'
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
        groups: [{
          groupDate: 'Mar 03',
          experienceTitle: 'Amazing Adventure',
          groupParticipants: [{
            id: 10,
            name: 'g s',
            experienceTitle: 'Amazing Adventure',
            roleTitles: 'Actor Gabe'  
          }]
        }]
      });
    });
  });

  describe('#playerShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });

  describe('#participantShowRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if does not exist', () => {});
  });
});
