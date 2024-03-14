const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const RelayController = require('../../src/controllers/relay');
const EntrywayController = require('../../src/controllers/entryway');
const TripResetHandler = require('../../src/handlers/trip_reset');
const TwilioUtil = require('../../src/handlers/twilio_util');

describe('TwilioUtil', () => {
  describe('#lookupOrCreateTripId', () => {
    const phoneNumber = '2223334444';
    const player = { tripId: 100 };

    it('returns player trip id if exists', async () => {
      const relay = { id: 10 };
      sandbox.stub(RelayController, 'lookupPlayer').resolves(player);
      sandbox.stub(EntrywayController, 'createTripFromRelay');

      const res = await TwilioUtil.lookupOrCreateTripId(relay, phoneNumber);

      // Returns trip id of existing player.
      assert.strictEqual(res, player.tripId);

      // Looks up player by relay and phone number.
      sinon.assert.calledWith(RelayController.lookupPlayer,
        relay, phoneNumber);

      // Doesn't try to create a new trip.
      sinon.assert.notCalled(EntrywayController.createTripFromRelay);
    });

    it('creates a trip if none exist', async () => {
      const relay = { id: 10 };
      const stubTrip = { id: 2 };
      sandbox.stub(RelayController, 'lookupPlayer').resolves(null);
      sandbox.stub(EntrywayController, 'createTripFromRelay')
        .resolves(stubTrip);
      sandbox.stub(TripResetHandler, 'resetToStart').resolves(null);

      const res = await TwilioUtil.lookupOrCreateTripId(relay, phoneNumber);

      // Creates a trip and returns new id.
      assert.strictEqual(res, stubTrip.id);

      // Calls create trip OK.
      sinon.assert.calledWith(EntrywayController.createTripFromRelay,
        relay, phoneNumber);

      // And calls reset to start
      sinon.assert.calledWith(TripResetHandler.resetToStart, 2);
    });
  });
});
