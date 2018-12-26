const config = require('../config');
const RelayController = require('../controllers/relay');
const RelayTrailheadController = require('../controllers/relay_trailhead');

var logger = config.logger.child({ name: 'handlers.twilio' });

const TwilioUtil = {};

/**
 * Get an existing trip id for a relay and a user number. If the relay is a
 * trailhead, create a new trip if one isn't found. Otherwise, return null.
 */
TwilioUtil.lookupOrCreateTripId = async (relay, userPhoneNumber) => {
  // Get participant or create trip.
  const participant = await (
    RelayController.lookupParticipant(relay, userPhoneNumber)
  );
  if (participant) {
    return participant.playthroughId;
  }
  if (relay.userPhoneNumber !== '') {
    logger.warn(`Relay ${relay.id} is not a trailhead; can't create a new trip.`);
    return null;
  }
  // If no participant, and it's a trailhead, then we need to create a new 
  // playthrough.
  const playthrough = await (
    RelayTrailheadController.createTrip(relay, userPhoneNumber)
  );
  return playthrough.id;
};

module.exports = TwilioUtil;
