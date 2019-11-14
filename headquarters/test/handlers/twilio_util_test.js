const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const RelayController = require('../../src/controllers/relay');
const TrailheadController = require('../../src/controllers/trailhead');
const TwilioUtil = require('../../src/handlers/twilio_util');

describe('TwilioUtil', () => {
  describe('#lookupOrCreateTripId', () => {
    const phoneNumber = '2223334444';
    const player = { tripId: 100 };

    it('returns player trip id if exists', async () => {
      const relay = { id: 10, userPhoneNumber: '2223334444' };
      sandbox.stub(RelayController, 'lookupPlayer').resolves(player);
      sandbox.stub(TrailheadController, 'createTripFromRelay');

      const res = await TwilioUtil.lookupOrCreateTripId(relay, phoneNumber);

      // Returns trip id of existing player.
      assert.strictEqual(res, player.tripId);

      // Looks up player by relay and phone number.
      sinon.assert.calledWith(RelayController.lookupPlayer,
        relay, phoneNumber);

      // Doesn't try to create a new trip.
      sinon.assert.notCalled(TrailheadController.createTripFromRelay);
    });

    it('creates a trip if none exist', async () => {
      const relay = { id: 10, userPhoneNumber: '' };
      const stubTrip = { id: 2 };
      sandbox.stub(RelayController, 'lookupPlayer').resolves(null);
      sandbox.stub(TrailheadController, 'createTripFromRelay')
        .resolves(stubTrip);

      const res = await TwilioUtil.lookupOrCreateTripId(relay, phoneNumber);

      // Creates a trip and returns new id.
      assert.strictEqual(res, stubTrip.id);

      // Calls create trip OK.
      sinon.assert.calledWith(TrailheadController.createTripFromRelay,
        relay, phoneNumber);
    });

    it('does not create a trip for non-trailhead', async () => {
      const relay = { id: 10, userPhoneNumber: '4445556666' };
      const stubTrip = { id: 2 };
      sandbox.stub(RelayController, 'lookupPlayer').resolves(null);
      sandbox.stub(TrailheadController, 'createTripFromRelay')
        .resolves(stubTrip);

      const res = await TwilioUtil.lookupOrCreateTripId(relay, phoneNumber);

      // Returns no trip.
      assert.strictEqual(res, null);

      // Doesn't try to create a trip since it's not a universal relay.
      sinon.assert.notCalled(TrailheadController.createTripFromRelay);
    });
  });
});
