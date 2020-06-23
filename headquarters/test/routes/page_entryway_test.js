const assert = require('assert');
const httpMocks = require('node-mocks-http');
const Sequelize = require('sequelize');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const pageEntrywayRoutes = require('../../src/routes/page_entryway');
const ExperienceController = require('../../src/controllers/experience');

describe('pageEntrywayRoutes', () => {
  describe('#entrywaySignupRoute', () => {
    it('returns 200', async () => {
      const tripId = 1;
      const roleName = 'role-aabbcc';

      const req = httpMocks.createRequest({
        params: {
          tripId: tripId,
          roleName: roleName
        }
      });
      const res = httpMocks.createResponse();

      const orgId = 1;
      const experienceId = 1;

      // stub db response
      const experience = {
        id: experienceId,
        title: 'Experience',
        org: {
          id: orgId,
          name: 'org',
          title: 'Org'            
        }
      };
      sandbox.stub(models.Trip, 'findOne').resolves({
        id: tripId,
        org_id: orgId,
        experience: experience
      });

      // stub experience script
      const script = {
        details: 'script details'
      };
      sandbox.stub(ExperienceController, 'findActiveScript').resolves(script);

      await pageEntrywayRoutes.signupRoute(req, res);

      // Test found players with correct arguments
      sinon.assert.calledOnce(models.Trip.findOne);
      assert.deepStrictEqual(models.Trip.findOne.firstCall.args, [{
        where: {
          id: tripId,
          isArchived: false
        },
        include: [{
          model: models.Experience,
          as: 'experience',
          include: [{
            model: models.Org,
            as: 'org'
          }]
        }]
      }]);

      sinon.assert.calledOnce(ExperienceController.findActiveScript);
      assert.deepStrictEqual(ExperienceController.findActiveScript.firstCall.args, [experience.id])

      // Test rendered ok
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getRenderView(), 'entryway/entryway');
      assert.deepStrictEqual(res._getRenderData(), {
        layout: 'entryway',
        experienceTitle: experience.title,
        script: script
      });
    });
    it.skip('redirects to their player page if they are already in the experience', () => {});
  });

  describe('#entrywaySignupSubmitRoute', () => {
    it.skip('returns 200', () => {});
    it.skip('returns 404 if trip does not exist', () => {});
    it.skip('creates user if user does not exist', () => {});
    it.skip('assigns user to role in trip', () => {});
  });
});
