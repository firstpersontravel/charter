const assert = require('assert');
const sinon = require('sinon');

const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const TripRelaysController = require('../../src/controllers/trip_relays');

const sandbox = sinon.sandbox.create();

describe('TripRelaysController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#getRelays', () => {

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
    const stubRelays = [{
      id: 1,
      forRoleName: 'for',
      asRoleName: 'as',
      withRoleName: 'with'
    }, {
      id: 2,
      forRoleName: 'with',
      asRoleName: 'with',
      withRoleName: 'for'
    }];

    it('gets relay with as and with params', async () => {
      sandbox.stub(models.Script, 'findById').resolves(stubScript);
      sandbox.stub(models.Relay, 'findAll').resolves(stubRelays);

      const filters = { asRoleName: 'as', withRoleName: 'with' };
      const res = await (
        TripRelaysController.getRelays(stubTrip, filters, 'sms_out')
      );

      sinon.assert.calledWith(models.Relay.findAll, {
        where: {
          stage: 'test',
          scriptName: 's',
          isActive: true,
          departureName: 'T1',
          asRoleName: 'as',
          withRoleName: 'with'
        }
      });
      assert.deepStrictEqual(res, [stubRelays[0]]);
    });

    it.skip('gets relay with only as param', () => {});
  });

  describe('#initiateCall', () => {
    it('initiates call to proper relay and participant', async () => {
      const trip = await models.Playthrough.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });
      const stubParticipant = models.Participant.build();

      sandbox.stub(TripRelaysController, 'getRelays').resolves([stubRelay]);
      sandbox.stub(models.Participant, 'find').resolves(stubParticipant);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test getRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.getRelays,
        trip, { asRoleName: 'Player', withRoleName: 'Actor' }, 'phone_out');
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

      sandbox.stub(TripRelaysController, 'getRelays').resolves([]);
      sandbox.stub(models.Participant, 'find').resolves();
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test getRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.getRelays,
        trip, { asRoleName: 'Player', withRoleName: 'Actor' }, 'phone_out');
      sinon.assert.notCalled(models.Participant.find);
      sinon.assert.notCalled(RelayController.initiateCall);
    });

    it('no-op if no participant found', async () => {
      const trip = await models.Playthrough.build({ id: 10 });
      const stubRelay = models.Relay.build({ forRoleName: 'Player' });

      sandbox.stub(TripRelaysController, 'getRelays').resolves([stubRelay]);
      sandbox.stub(models.Participant, 'find').resolves(null);
      sandbox.stub(RelayController, 'initiateCall').resolves();

      // initiate call to Player as Actor
      await TripRelaysController.initiateCall(trip, 'Player', 'Actor', false);

      // test getRelays called looking for the player relay (for target)
      sinon.assert.calledWith(TripRelaysController.getRelays,
        trip, { asRoleName: 'Player', withRoleName: 'Actor' }, 'phone_out');
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

      sandbox.stub(TripRelaysController, 'getRelays').resolves([stubRelay]);
      sandbox.stub(RelayController, 'sendMessage').resolves();

      await TripRelaysController
        .sendAdminMessage(trip, 'StageManager', 'test');

      // searches relays
      sandbox.assert.calledWith(TripRelaysController.getRelays,
        trip, { forRoleName: 'StageManager' }, 'admin_out');

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
