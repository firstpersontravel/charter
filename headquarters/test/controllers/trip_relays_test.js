const assert = require('assert');
const sinon = require('sinon');

const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const RelaysController = require('../../src/controllers/relays');
const TripRelaysController = require('../../src/controllers/trip_relays');

const sandbox = sinon.sandbox.create();

describe('TripRelaysController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#userPhoneNumberForRelay', () => {

    const trip = { id: 1 };

    it('looks up user phone number for a relay', async () => {
      const relaySpec = { for: 'ForRole' };
      const participant = { user: { phoneNumber: '1234567890' } };

      sandbox.stub(models.Participant, 'find').resolves(participant);

      const res = await (
        TripRelaysController.userPhoneNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, participant.user.phoneNumber);
      sinon.assert.calledWith(models.Participant.find, {
        where: { roleName: 'ForRole', playthroughId: 1 },
        include: [{ model: models.User, as: 'user' }]
      });
    });

    it('returns blank for trailhead relay', async () => {
      const relaySpec = { for: 'ForRole', trailhead: true };

      sandbox.stub(models.Participant, 'find');

      const res = await (
        TripRelaysController.userPhoneNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, '');
      sinon.assert.notCalled(models.Participant.find);
    });

    it('returns null when no participant found', async () => {
      const relaySpec = { for: 'ForRole' };

      sandbox.stub(models.Participant, 'find').resolves(null);

      const res = await (
        TripRelaysController.userPhoneNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, null);
    });

    it('returns null when no user phone number', async () => {
      const relaySpec = { for: 'ForRole' };
      const participant = { user: null };

      sandbox.stub(models.Participant, 'find').resolves(participant);

      const res = await (
        TripRelaysController.userPhoneNumberForRelay(trip, relaySpec)
      );
      assert.strictEqual(res, null);
    });
  });

  describe('#ensureRelay', () => {

    const trip = { id: 1 };
    const relaySpec = { for: 'Role' };
    const phoneNum = '1234567890';
    const stubRelay = {};

    it('fetches relay by phone number', async () => {
      sandbox.stub(RelaysController, 'ensureRelay').resolves(stubRelay);
      sandbox.stub(TripRelaysController, 'userPhoneNumberForRelay')
        .resolves(phoneNum);

      const res = await TripRelaysController.ensureRelay(trip, 's', relaySpec);

      assert.strictEqual(res, stubRelay);
      sinon.assert.calledWith(TripRelaysController.userPhoneNumberForRelay,
        trip, relaySpec);
      sinon.assert.calledWith(RelaysController.ensureRelay,
        's', relaySpec, phoneNum);
    });

    it('fetches relay by blank phone', async () => {
      sandbox.stub(RelaysController, 'ensureRelay').resolves(stubRelay);
      sandbox.stub(TripRelaysController, 'userPhoneNumberForRelay')
        .resolves('');

      const res = await TripRelaysController.ensureRelay(trip, 's', relaySpec);

      assert.strictEqual(res, stubRelay);
      sinon.assert.calledWith(TripRelaysController.userPhoneNumberForRelay,
        trip, relaySpec);
      sinon.assert.calledWith(RelaysController.ensureRelay,
        's', relaySpec, '');
    });

    it('returns null if no phone number found', async () => {
      sandbox.stub(RelaysController, 'ensureRelay');
      sandbox.stub(TripRelaysController, 'userPhoneNumberForRelay')
        .resolves(null);

      const res = await TripRelaysController.ensureRelay(trip, 's', relaySpec);

      assert.strictEqual(res, null);
      sinon.assert.notCalled(RelaysController.ensureRelay);
      sinon.assert.calledWith(TripRelaysController.userPhoneNumberForRelay,
        trip, relaySpec);
    });
  });

  describe('#ensureRelays', () => {

    const stubScript = models.Script.build({
      name: 's',
      content: {
        relays: [
          { for: 'for', as: 'as', with: 'with', sms_out: true },
          { for: 'with', as: 'with', with: 'for' }
        ]
      }
    });
    const stubTrip = models.Playthrough.build({
      departureName: 'T1',
    });
    const stubRelay = {
      forRoleName: 'for',
      asRoleName: 'as',
      withRoleName: 'with'
    };

    it('gets relay with as and with params', async () => {
      // Script has multiple relay specs
      sandbox.stub(models.Script, 'findById').resolves(stubScript);
      sandbox.stub(TripRelaysController, 'ensureRelay').resolves(stubRelay);

      const filters = { as: 'as', with: 'with' };
      const res = await (
        TripRelaysController.ensureRelays(stubTrip, filters, 'sms_out')
      );

      // Should filter out by spec and only call ensureRelay with one
      sinon.assert.calledOnce(TripRelaysController.ensureRelay);
      sinon.assert.calledWith(TripRelaysController.ensureRelay, stubTrip,
        stubScript.name, stubScript.content.relays[0]);
      // Should return list of relays
      assert.deepStrictEqual(res, [stubRelay]);
    });
  });

  describe('#initiateCall', () => {
    it('initiates call to proper relay and participant', async () => {
      const trip = await models.Playthrough.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });
      const stubParticipant = models.Participant.build();

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([stubRelay]);
      sandbox.stub(models.Participant, 'find').resolves(stubParticipant);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' }, 'phone_out');

      // test participant looked for for target
      sinon.assert.calledWith(models.Participant.find, {
        where: { playthroughId: 10, roleName: 'Player' },
        include: [{ model: models.User, as: 'user' }]
      });
      // Test initiate call was called with resulting records
      sinon.assert.calledWith(RelayController.initiateCall,
        stubRelay, stubParticipant, false);
    });

    it('no-op if no relays found', async () => {
      const trip = await models.Playthrough.build({ id: 10 });

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([]);
      sandbox.stub(models.Participant, 'find').resolves();
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' }, 'phone_out');

      sinon.assert.notCalled(models.Participant.find);
      sinon.assert.notCalled(RelayController.initiateCall);
    });

    it('no-op if no participant found', async () => {
      const trip = await models.Playthrough.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([stubRelay]);
      sandbox.stub(models.Participant, 'find').resolves(null);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test ensureRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { as: 'Player', with: 'Actor' }, 'phone_out');

      // test participant looked for for target
      sinon.assert.calledWith(models.Participant.find, {
        where: { playthroughId: 10, roleName: 'Player' },
        include: [{ model: models.User, as: 'user' }]
      });
      sinon.assert.notCalled(RelayController.initiateCall);
    });
  });

  describe('#sendAdminMessage', () => {
    it('sends an admin message', async () => {
      const trip = await models.Playthrough.build();
      const stubRelay = models.Relay.build();

      sandbox.stub(TripRelaysController, 'ensureRelays').resolves([stubRelay]);
      sandbox.stub(RelayController, 'sendMessage').resolves();

      await TripRelaysController
        .sendAdminMessage(trip, 'StageManager', 'test');

      // searches relays
      sandbox.assert.calledWith(TripRelaysController.ensureRelays,
        trip, { for: 'StageManager' }, 'admin_out');

      // sends message to resulting relay
      sandbox.assert.calledWith(RelayController.sendMessage,
        stubRelay, trip, '[Admin] test', null);
    });
  });

  describe('#partsForRelayMessage', () => {
    it.skip('sends images as media', () => {});
    it.skip('sends mp3 audio as media', () => {});
    it.skip('sends text as text', () => {});
    it.skip('skips m4a audio', () => {});
  });

  describe('#relayMessage', () => {
    it.skip('sends an admin message', () => {});
  });
});
