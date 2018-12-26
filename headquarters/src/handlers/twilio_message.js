const config = require('../config');
const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TwilioUtil = require('./twilio_util');

var logger = config.logger.child({ name: 'handlers.twilio' });

function getMessageActions(relay, body, media) {
  const actions = [];
  // Message text
  if (body) {
    actions.push({
      name: 'custom_message',
      params: {
        from_role_name: relay.asRoleName,
        to_role_name: relay.withRoleName,
        message_type: 'text',
        message_content: body,
        suppress_relay_id: relay.id
      }
    });
  }
  // Message images
  actions.push(...media.map(mediaItem => ({
    name: 'custom_message',
    params: {
      from_role_name: relay.asRoleName,
      to_role_name: relay.withRoleName,
      message_type: 'image',
      message_content: mediaItem.url,
      suppress_relay_id: relay.id
    }
  })));
  return actions;
}

/**
 * Handle an incoming message and return success.
 */
async function handleIncomingMessage(fromNumber, toNumber, body, media) {
  const relay = await RelaysController.findByNumber(toNumber, fromNumber);

  // No action if we can't find the right relay
  if (!relay) {
    logger.warn('Message target relay not found.');
    return false;
  }

  // Or if relay isn't an SMS relay.
  const script = await RelayController.scriptForRelay(relay);
  if (!script) {
    logger.warn('Message target script not found.');
    return false;
  }

  const relaySpec = RelayController.specForRelay(script, relay);
  if (!relaySpec.sms_in) {
    logger.warn(`Relay ${relay.id} does not accept incoming SMS.`);
    return false;
  }

  // Get participant or create trip.
  const tripId = await TwilioUtil.lookupOrCreateTripId(relay, fromNumber);
  if (!tripId) {
    // If we couldn't create one, probably cos it's not a trailhead.
    return false;
  }

  // Whether it's a trailhead or not, 
  const actions = getMessageActions(relay, body, media);
  for (let action of actions) {
    await TripActionController.applyAction(tripId, action);
    await TripNotifyController.notifyAction(tripId, action);
  }
  return true;
}

const TwilioMessageHandler = {
  handleIncomingMessage
};

module.exports = TwilioMessageHandler;
