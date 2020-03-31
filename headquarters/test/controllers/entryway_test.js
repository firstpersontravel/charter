const moment = require('moment-timezone');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const EntrywayController = require('../../src/controllers/entryway');
const TripsController = require('../../src/controllers/trips');

const mockEntryway = {
  orgId: 9,
  experienceId: 20,
  forRoleName: 'Player'
};
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
      name: 'actor',
      type: 'performer'
    }, {
      name: 'npc',
      type: 'scripted',
    }, {
      name: 'player',
      type: 'traveler'
    }]
  }
};

describe('EntrywayController', () => {
  describe('#assignActors', () => {
    it('assigns users for actor roles only', async () => {
      sandbox.stub(EntrywayController, 'assignActor').resolves();

      await EntrywayController.assignActors(mockScript, mockTrip);

      // Test called only once with the actor
      sinon.assert.calledOnce(EntrywayController.assignActor);
      sinon.assert.calledWith(EntrywayController.assignActor,
        mockScript.experience, mockTrip, mockScript.content.roles[0]);
    });
  });

  describe('#assignActor', () => {
    it('assigns first matching user', async () => {
      const users = [
        { userId: 4 },
        { userId: 5 }
      ];
      sandbox.stub(models.Profile, 'findAll').resolves(users);
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
        { userId: 4 },
        { where: { tripId: 100, roleName: 'role' } });
    });

    it('does nothing if no matching user is found', async () => {
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

  describe('#createTripFromRelay', () => {
    it('creates group and user when they don\'t exist', async () => {
      const mockGroup = { id: 1 };
      const mockUser = { id: 2 };
      const mockProfile = { isActive: true };

      sandbox.stub(RelayController, 'scriptForRelay').resolves(mockScript);
      sandbox.stub(models.Group, 'findOrCreate').resolves([mockGroup]);
      sandbox.stub(models.User, 'findOrCreate').resolves([mockUser]);
      sandbox.stub(models.Profile, 'findOrCreate').resolves([mockProfile]);
      sandbox.stub(TripsController, 'createTrip').resolves(mockTrip);
      sandbox.stub(models.Player, 'update').resolves();
      sandbox.stub(EntrywayController, 'assignActors').resolves();

      // Create from entryway
      await EntrywayController.createTripFromRelay(mockEntryway, '123');

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
      sinon.assert.calledWith(models.User.findOrCreate, {
        where: {
          orgId: 9,
          experienceId: 20,
          isActive: true,
          phoneNumber: '123'
        },
        defaults: { firstName: 'Script Player' }
      });
      sinon.assert.calledWith(models.Profile.findOrCreate, {
        where: {
          orgId: 9,
          isArchived: false,
          roleName: 'Player',
          experienceId: 20,
          userId: 2
        },
        defaults: {
          firstName: 'Script Player',
          isActive: true,
          isArchived: false
        }
      });
      sinon.assert.calledWith(EntrywayController.assignActors,
        mockScript, mockTrip);
    });
  });
});
