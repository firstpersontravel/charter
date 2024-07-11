const moment = require('moment-timezone');
const sinon = require('sinon');

const RoleCore = require('fptcore/src/cores/role');

const { sandbox, mockNow } = require('../mocks');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const EntrywayController = require('../../src/controllers/entryway');
const TripsController = require('../../src/controllers/trips');

const mockTrip = { id: 100 };
const mockScript = {
  id: 10,
  orgId: 9,
  experienceId: 20,
  experience: {
    id: 20,
    name: 'script',
    title: 'Script',
    timezone: 'US/Pacific',
  },
  content: {
    roles: [{
      name: 'actor'
    }, {
      name: 'npc'
    }, {
      name: 'player'
    }]
  }
};

describe('EntrywayController', () => {
  describe('#assignActors', () => {
    it('assigns participants for actor roles only', async () => {
      sandbox.stub(RoleCore, 'canRoleHaveParticipant')
        .callsFake((scriptContent, role) => (
          role.name === 'actor' || role.name === 'player'
        ));
      sandbox.stub(EntrywayController, 'assignActor').resolves();

      await EntrywayController.assignActors(mockScript, mockTrip, 'player');

      // Test called only once with the actor
      sinon.assert.calledOnce(EntrywayController.assignActor);
      sinon.assert.calledWith(EntrywayController.assignActor,
        mockScript.experience, mockTrip, mockScript.content.roles[0]);
    });
  });

  describe('#assignActor', () => {
    it('assigns first matching participant', async () => {
      const profiles = [
        { participantId: 4 },
        { participantId: 5 }
      ];
      sandbox.stub(models.Profile, 'findAll').resolves(profiles);
      sandbox.stub(models.Player, 'update').resolves();

      await EntrywayController.assignActor(
        mockScript.experience, mockTrip, { name: 'role' });

      // Test assertions
      sinon.assert.calledWith(models.Profile.findAll, {
        where: {
          isActive: true,
          isArchived: false,
          experienceId: 20,
          roleName: 'role'
        }
      });
      // test update player called
      sinon.assert.calledWith(models.Player.update,
        { participantId: 4 },
        { where: { tripId: 100, roleName: 'role' } });
    });

    it('does nothing if no matching participant is found', async () => {
      sandbox.stub(models.Profile, 'findAll').resolves([]);
      sandbox.stub(models.Player, 'update').resolves();

      await EntrywayController.assignActor(
        mockScript.experience, mockTrip, { name: 'role' });

      // Test assertions
      sinon.assert.calledWith(models.Profile.findAll, {
        where: {
          isActive: true,
          isArchived: false,
          experienceId: 20,
          roleName: 'role'
        }
      });
      sinon.assert.notCalled(models.Player.update);
    });
  });

  describe('#createTripFromEntryway', () => {
    it('creates group and participant when they don\'t exist', async () => {
      const mockGroup = { id: 1 };
      const mockParticipant = { id: 2 };
      const mockProfile = { isActive: true };

      sandbox.stub(RelayController, 'scriptForRelay').resolves(mockScript);
      sandbox.stub(models.Group, 'findOrCreate').resolves([mockGroup]);
      sandbox.stub(models.Participant, 'findOrCreate').resolves([mockParticipant]);
      sandbox.stub(models.Profile, 'findOrCreate').resolves([mockProfile]);
      sandbox.stub(TripsController, 'createTrip').resolves(mockTrip);
      sandbox.stub(models.Player, 'update').resolves();
      sandbox.stub(EntrywayController, 'assignActors').resolves();

      // Create from entryway
      await EntrywayController.createTripFromEntryway(mockScript, 'player', '123');

      // Test calls
      sinon.assert.calledWith(models.Group.findOrCreate, {
        where: {
          orgId: 9,
          experienceId: 20,
          scriptId: 10,
          date: moment.utc()
            .tz(mockScript.experience.timezone)
            .format('YYYY-MM-DD'),
          isArchived: false
        }
      });
      sinon.assert.calledWith(models.Participant.findOrCreate, {
        where: {
          orgId: 9,
          experienceId: 20,
          isArchived: false,
          phoneNumber: '123'
        },
        defaults: {
          createdAt: mockNow,
          name: 'Script Player'
        }
      });
      sinon.assert.calledWith(models.Profile.findOrCreate, {
        where: {
          orgId: 9,
          isArchived: false,
          roleName: 'player',
          experienceId: 20,
          participantId: 2
        },
        defaults: {
          isActive: true,
          isArchived: false
        }
      });
      sinon.assert.calledWith(EntrywayController.assignActors,
        mockScript, mockTrip);
    });
  });
});
