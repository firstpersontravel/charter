const moment = require('moment-timezone');
const sinon = require('sinon');

const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const RelayTrailheadController = require(
  '../../src/controllers/relay_trailhead');
const TripRelaysController = require('../../src/controllers/trip_relays');
const TripsController = require('../../src/controllers/trips');

const sandbox = sinon.sandbox.create();

const mockTrailhead = {
  forRoleName: 'Player',
  scriptName: 'script',
  departureName: 'Main'
};
const mockPlaythrough = { id: 100 };
const mockScript = {
  id: 10,
  name: 'script',
  title: 'Script',
  timezone: 'US/Pacific',
  content: {
    roles: [{
      name: 'actor',
      actor: true,
      user: true
    }, {
      name: 'npc',
      actor: false,
      user: false
    }, {
      name: 'player',
      actor: false,
      user: true
    }]
  }
};

describe('RelayTrailheadController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#assignActors', () => {

    it('assigns users for actor roles only', async () => {
      sandbox.stub(RelayTrailheadController, 'assignActor').resolves();

      await RelayTrailheadController.assignActors(mockScript, mockPlaythrough);

      // Test called only once with the actor
      sinon.assert.calledOnce(RelayTrailheadController.assignActor);
      sinon.assert.calledWith(RelayTrailheadController.assignActor,
        mockScript, mockPlaythrough, mockScript.content.roles[0]);
    });
  });

  describe('#assignActor', () => {

    it('assigns first matching user', async () => {
      const users = [
        { userId: 4 },
        { userId: 5 }
      ];
      sandbox.stub(models.Profile, 'findAll').resolves(users);
      sandbox.stub(models.Participant, 'update').resolves();
      sandbox.stub(TripRelaysController, 'sendAdminMessage').resolves();

      await RelayTrailheadController.assignActor(mockScript, mockPlaythrough,
        { name: 'role' });

      // Test assertions
      sinon.assert.calledWith(models.Profile.findAll, {
        where: {
          isActive: true,
          isArchived: false,
          scriptName: 'script',
          roleName: 'role'
        }
      });
      // test update participant called
      sinon.assert.calledWith(models.Participant.update,
        { userId: 4 },
        { where: { playthroughId: 100, roleName: 'role' } });

      // Test admin message sent
      sinon.assert.calledWith(
        TripRelaysController.sendAdminMessage,
        mockPlaythrough,
        'role',
        'New trip for Script as role: http://test/actor/4'
      );
    });

    it('does nothing if no matching user is found', async () => {
      sandbox.stub(models.Profile, 'findAll').resolves([]);
      sandbox.stub(models.Participant, 'update').resolves();
      sandbox.stub(TripRelaysController, 'sendAdminMessage').resolves();

      await RelayTrailheadController.assignActor(mockScript, mockPlaythrough,
        { name: 'role' });

      // Test assertions
      sinon.assert.calledWith(models.Profile.findAll, {
        where: {
          isActive: true,
          isArchived: false,
          scriptName: 'script',
          roleName: 'role'
        }
      });
      sinon.assert.notCalled(models.Participant.update);
      sinon.assert.notCalled(TripRelaysController.sendAdminMessage);
    });
  });

  describe('#createTrip', () => {

    it('creates group and user when they don\'t exist', async () => {
      const mockGroup = { id: 1 };
      const mockUser = { id: 2 };
      const mockProfile = { isActive: true };

      sandbox.stub(RelayController, 'scriptForRelay').resolves(mockScript);
      sandbox.stub(models.Group, 'findOrCreate').resolves([mockGroup]);
      sandbox.stub(models.User, 'findOrCreate').resolves([mockUser]);
      sandbox.stub(models.Profile, 'findOrCreate').resolves([mockProfile]);
      sandbox.stub(TripsController, 'createWithDefaults')
        .resolves(mockPlaythrough);
      sandbox.stub(models.Participant, 'update').resolves();
      sandbox.stub(RelayTrailheadController, 'assignActors').resolves();

      // Create from trailhead
      await RelayTrailheadController.createTrip(mockTrailhead, '123');

      // Test calls
      sinon.assert.calledWith(models.Group.findOrCreate, {
        where: {
          scriptId: 10,
          date: moment.utc().tz(mockScript.timezone).format('YYYY-MM-DD'),
          isArchived: false
        }
      });
      sinon.assert.calledWith(models.User.findOrCreate, {
        where: { isActive: true, phoneNumber: '123' },
        defaults: { firstName: 'Script Player' }
      });
      sinon.assert.calledWith(models.Profile.findOrCreate, {
        where: {
          isArchived: false,
          roleName: 'Player',
          scriptName: 'script',
          userId: 2
        },
        defaults: {
          firstName: 'Script Player',
          isActive: true,
          isArchived: false
        }
      });
      sinon.assert.calledWith(RelayTrailheadController.assignActors,
        mockScript, mockPlaythrough);
    });
  });
});
