const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const { mockNow, sandbox } = require('../mocks');
const models = require('../../src/models');
const pageEntrywayRoutes = require('../../src/routes/page_entryway');
const ExperienceController = require('../../src/controllers/experience');

describe('pageEntrywayRoutes', () => {
  const orgId = 2;
  const experienceId = 3;
  const experience = {
    id: experienceId,
    title: 'Experience',
    org: { id: orgId, name: 'org', title: 'Org' }
  };
  const tripId = 5;
  const trip = {
    id: tripId,
    orgId: orgId,
    experience: experience,
    experienceId: experienceId
  };
  const roleName = 'role-aabbcc';
  const script = {
    content: { roles: [{ name: roleName, title: 'Audience' }] },
    details: 'script details',
    experience: experience,
    experienceId: experienceId,
    orgId: orgId
  };
  const playerId = 7;
  const player = {
    id: playerId,
    tripId: tripId,
    roleName: roleName
  };

  describe('#joinRoute', () => {
    it('returns 200 if they are not yet in the experience', async () => {
      // stub db response
      sandbox.stub(models.Trip, 'findOne').resolves(trip);
      // stub experience script
      sandbox.stub(ExperienceController, 'findActiveScript').resolves(script);

      const res = httpMocks.createResponse();
      const req = httpMocks.createRequest({
        params: {
          tripId: tripId,
          roleName: roleName
        }
      });
      await pageEntrywayRoutes.joinRoute(req, res);

      // Test found trip with correct arguments
      sinon.assert.calledOnce(models.Trip.findOne);
      assert.deepStrictEqual(models.Trip.findOne.firstCall.args, [{
        where: { id: tripId, isArchived: false },
        include: [{ model: models.Experience, as: 'experience' }]
      }]);

      sinon.assert.calledOnce(ExperienceController.findActiveScript);
      assert.deepStrictEqual(ExperienceController.findActiveScript.firstCall.args, [experience.id]);

      // Test rendered ok
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getRenderView(), 'entryway/entryway');
      assert.deepStrictEqual(res._getRenderData(), {
        layout: 'entryway',
        experienceTitle: experience.title,
        actionTitle: 'Join as Audience',
        askForEmail: false,
        askForPhone: false,
        style: ''
      });
    });

    it('redirects to their player page if they are already in the experience', async () => {
      // stub db response
      sandbox.stub(models.Trip, 'findOne').resolves(trip);

      const existingRoleName = 'role-zzzxxt';
      const existingParticipantId = 11;
      const existingPlayerId = 13;
      const existingPlayer = {
        id: existingPlayerId,
        roleName: existingRoleName,
        participantId: existingParticipantId,
        trip: { id: tripId }
      };

      sandbox.stub(models.Player, 'findOne').resolves(existingPlayer);
      sandbox.stub(ExperienceController, 'findActiveScript').resolves({
        content: { roles: [{ name: existingRoleName }] }
      });

      const res = httpMocks.createResponse();
      const req = httpMocks.createRequest({
        params: { tripId: tripId, roleName: existingRoleName },
        cookies: { ['exp-' + experience.id]: existingPlayer.id }
      });

      await pageEntrywayRoutes.joinRoute(req, res);

      // Test rendered redirect
      assert.strictEqual(res.statusCode, 302);
      const redirectUrl = `/travel/${existingPlayer.tripId}/${existingPlayer.id}`;
      assert.strictEqual(res._getRedirectUrl(), redirectUrl);
    });
  });

  describe('#joinSubmitRoute', () => {
    describe('if submitted with proper participant data', () => {
      const participantData = {
        name: 'Test Participant',
        email: 'testparticipant@example.com',
        phone: '5555555555'
      };
      const newParticipantId = 17;
      const participant = {
        id: newParticipantId,
        name: 'name',
        orgId: orgId,
        experienceId: experienceId,
        isActive: true,
        phoneNumber: `+1${participantData.phone}`
      };
      const profile = { isActive: true };

      beforeEach(() => {
        // stub db response
        sandbox.stub(models.Trip, 'findByPk').resolves(trip);
        // stub experience script
        sandbox.stub(ExperienceController, 'findActiveScript').resolves(script);
        
        // stub participant and player updates
        sandbox.stub(models.Participant, 'findOrCreate').resolves([participant]);
        sandbox.stub(models.Participant, 'update').resolves(null);
        
        // stub player for role in trip
        sandbox.stub(models.Player, 'findOrCreate').resolves([player]);
        sandbox.stub(models.Player, 'update').resolves(null);

        sandbox.stub(models.Profile, 'findOrCreate').resolves([profile]);
        sandbox.stub(models.Profile, 'update').resolves(null);
      });

      it('finds the trip and redirects to the player interface', async () => {
        const res = httpMocks.createResponse();
        const req = httpMocks.createRequest({
          params: { tripId: tripId, roleName: roleName },
          body: participantData
        });
        await pageEntrywayRoutes.joinSubmitRoute(req, res);

        // Test found trip with correct arguments
        sinon.assert.calledOnce(models.Trip.findByPk);
        assert.deepStrictEqual(models.Trip.findByPk.firstCall.args, [tripId]);

        // Test the cookie was set properly
        assert.deepStrictEqual(res.cookies[`exp-${experience.id}`].value, player.id);

        // Test rendered redirect
        assert.strictEqual(res.statusCode, 302);
        const redirectUrl = `/travel/${player.tripId}/${player.id}`;
        assert.strictEqual(res._getRedirectUrl(), redirectUrl);
      });

      it('creates participant', async () => {
        const res = httpMocks.createResponse();
        const req = httpMocks.createRequest({
          params: { tripId: tripId, roleName: roleName },
          body: participantData
        });
        await pageEntrywayRoutes.joinSubmitRoute(req, res);

        sinon.assert.calledOnce(models.Participant.findOrCreate);
        assert.deepStrictEqual(models.Participant.findOrCreate.firstCall.args, [{
          where: {
            orgId: script.orgId,
            experienceId: script.experienceId,
            isActive: true,
            phoneNumber: `+1${participantData.phone}`
          },
          defaults: {
            createdAt: mockNow,
            name: 'Test Participant',
            email: 'testparticipant@example.com',
            phoneNumber: '+15555555555'
          }
        }]);
      });

      it('assigns participant to role in trip', async () => {
        const res = httpMocks.createResponse();
        const req = httpMocks.createRequest({
          params: { tripId: tripId, roleName: roleName },
          body: participantData
        });
        await pageEntrywayRoutes.joinSubmitRoute(req, res);

        sinon.assert.calledOnce(models.Player.update);
        assert.deepStrictEqual(models.Player.update.firstCall.args, [
          { participantId: participant.id },
          { where: { id: player.id } }
        ]);
      });
    });
  });
});
