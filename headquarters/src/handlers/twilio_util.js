const RelayController = require('../controllers/relay');
const EntrywayController = require('../controllers/entryway');
const TripResetHandler = require('./trip_reset');

class TwilioUtil {
  /**
   * Get an existing trip id for a relay and a user number. If the relay is an
   * entryway, create a new trip if one isn't found. Otherwise, return null.
   */
  static async lookupOrCreateTripId(relay, participantPhoneNumber) {
    // Get player or create trip.
    const player = await RelayController.lookupPlayer(relay, participantPhoneNumber);
    if (player) {
      return player.tripId;
    }
    // If no player, and it's an entryway, then we need to create a new trip.
    const trip = await EntrywayController.createTripFromRelay(relay, 
      participantPhoneNumber);

    // If we created a trip, reset it to the start to initiate starting 
    // actions like start scene
    await TripResetHandler.resetToStart(trip.id);

    // Just return the id.
    return trip.id;
  }
}

module.exports = TwilioUtil;
