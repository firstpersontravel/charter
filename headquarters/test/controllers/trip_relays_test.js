const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const RelaysController = require('../../src/controllers/relays');
const TripRelaysController = require('../../src/controllers/trip_relays');

describe('TripRelaysController', () => {
  describe('#userNumberForRelay', () => {
    const trip = { id: 1 };

    it('looks up user phone number for a relay', async () => {
      const relaySpec = { for: 'ForRole' };
      const player = { user: { phoneNumber: '1234567890' } };

      sandbox.stub(models.Player, 'findOne').resolves(player);

      const res = await (
        TripRelaysController.userNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, player.user.phoneNumber);
      sinon.assert.calledWith(models.Player.findOne, {
        where: { roleName: 'ForRole', tripId: 1 },
        include: [{ model: models.User, as: 'user' }]
      });
    });

    it('returns null when no player found', async () => {
      const relaySpec = { for: 'ForRole' };

      sandbox.stub(models.Player, 'findOne').resolves(null);

      const res = await (
        TripRelaysController.userNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, null);
    });

    it('returns null when no user phone number', async () => {
      const relaySpec = { for: 'ForRole' };
      const player = { user: null };

      sandbox.stub(models.Player, 'findOne').resolves(player);

      const res = await (
        TripRelaysController.userNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, null);
    });
  });

  describe('#ensureRelay', () => {
    const trip = { orgId: 2, id: 1, departureName: 'dep1', experienceId: 10 };
    const relaySpec = { for: 'Role' };
    const phoneNum = '1234567890';
    const stubRelay = {};

    it('fetches relay by phone number', async () => {
      sandbox.stub(RelaysController, 'ensureRelay').resolves(stubRelay);
      sandbox.stub(TripRelaysController, 'userNumberForRelay')
        .resolves(phoneNum);

      const res = await TripRelaysController.ensureRelay(trip, relaySpec);

      assert.strictEqual(res, stubRelay);
      sinon.assert.calledWith(TripRelaysController.userNumberForRelay,
        trip, relaySpec);
      sinon.assert.calledWith(RelaysController.ensureRelay,
        2, 10, 'dep1', relaySpec, phoneNum);
    });

    it('fetches relay for trailhead', async () => {
      const trailheadSpec = { for: 'Role', trailhead: true, experienceId: 10 };
      sandbox.stub(RelaysController, 'ensureRelay').resolves(stubRelay);
      sandbox.stub(TripRelaysController, 'userNumberForRelay');

      const res = await TripRelaysController.ensureRelay(
        trip, trailheadSpec);

      assert.strictEqual(res, stubRelay);
      sinon.assert.notCalled(TripRelaysController.userNumberForRelay);
      sinon.assert.calledWith(RelaysController.ensureRelay,
        2, 10, 'dep1', trailheadSpec, '');
    });

    it('returns null if no phone number found', async () => {
      sandbox.stub(RelaysController, 'ensureRelay');
      sandbox.stub(TripRelaysController, 'userNumberForRelay')
        .resolves(null);

      const res = await TripRelaysController.ensureRelay(trip, relaySpec);

      assert.strictEqual(res, null);
      sinon.assert.notCalled(RelaysController.ensureRelay);
      sinon.assert.calledWith(TripRelaysController.userNumberForRelay,
        trip, relaySpec);
    });
  });

  describe('#ensureRelays', () => {
    const stubExperience = models.Experience.build({
      name: 'journey'
    });

    const stubScript = models.Script.build({
      content: {
        relays: [
          { for: 'for', as: 'as', with: 'with' },
          { for: 'with', as: 'with', with: 'for' }
        ]
      }
    });

    const stubTrip = models.Trip.build({
      departureName: 'T1',
    });

    const stubRelay = {
      forRoleName: 'for',
      asRoleName: 'as',
      withRoleName: 'with'
    };

    it('gets relay with as and with params', async () => {
      // Script has multiple relay specs
      sandbox.stub(models.Script, 'findByPk').resolves(stubScript);
      sandbox.stub(models.Experience, 'findByPk').resolves(stubExperience);
      sandbox.stub(TripRelaysController, 'ensureRelay').resolves(stubRelay);

      const filters = { as: 'as', with: 'with' };
      const res = await (
        TripRelaysController.ensureRelays(stubTrip, filters)
      );

      // Should filter out by spec and only call ensureRelay with one
      sinon.assert.calledOnce(TripRelaysController.ensureRelay);
      sinon.assert.calledWith(TripRelaysController.ensureRelay, stubTrip,
        stubScript.content.relays[0]);
      // Should return list of relays
      assert.deepStrictEqual(res, [stubRelay]);
    });

    it.skip('creates relay if does not exist', async () => {});
  });

  describe('#initiateCall', () => {
    it('initiates call to proper relay and player', async () => {
      const trip = await models.Trip.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });
      const stubPlayer = models.Player.build();

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([stubRelay]);
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' });

      // test player looked for for target
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: 10, roleName: 'Player' },
        include: [{ model: models.User, as: 'user' }]
      });
      // Test initiate call was called with resulting records
      sinon.assert.calledWith(RelayController.initiateCall,
        stubRelay, stubPlayer, false);
    });

    it('no-op if no relays found', async () => {
      const trip = await models.Trip.build({ id: 10 });

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([]);
      sandbox.stub(models.Player, 'findOne').resolves();
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' });

      sinon.assert.notCalled(models.Player.findOne);
      sinon.assert.notCalled(RelayController.initiateCall);
    });

    it('no-op if no player found', async () => {
      const trip = await models.Trip.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([stubRelay]);
      sandbox.stub(models.Player, 'findOne').resolves(null);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' });

      // test player looked for for target
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: 10, roleName: 'Player' },
        include: [{ model: models.User, as: 'user' }]
      });
      sinon.assert.notCalled(RelayController.initiateCall);
    });
  });

  describe('#_partsForRelayMessage', () => {
    it.skip('sends images as media', () => {});
    it.skip('sends mp3 audio as media', () => {});
    it.skip('sends text as text', () => {});
    it.skip('skips m4a audio', () => {});
  });

  describe('#relayMessage', () => {
    it.skip('sends an admin message', () => {});
  });
});
