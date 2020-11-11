const config = require('../config');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TwilioUtil = require('./twilio_util');

var logger = config.logger.child({ name: 'handlers.twilio_message' });

function getMessageActions(relay, body, media) {
  const actions = [];
  // Message text
  if (body) {
    actions.push({
      name: 'send_text',
      params: {
        from_role_name: relay.asRoleName,
        to_role_name: relay.withRoleName,
        content: body,
        from_relay_id: relay.id,
        reply_needed: true
      }
    });
  }
  // Message images
  for (const mediaItem of media) {
    if (mediaItem.contentType.startsWith('image/')) {
      actions.push({
        name: 'send_image',
        params: {
          from_role_name: relay.asRoleName,
          to_role_name: relay.withRoleName,
          image: mediaItem.url,
          from_relay_id: relay.id,
          reply_needed: true
        }
      });
    }
  }
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
  if (!relaySpec) {
    logger.warn(`Relay ${relay.id} does not have a spec in this script.`);
    return false;
  }

  // Get player or create trip.
  const tripId = await TwilioUtil.lookupOrCreateTripId(relay, fromNumber);
  if (!tripId) {
    // If we couldn't create one, probably cos it's not an entryway.
    return false;
  }

  // Whether it's an entryway or not, 
  const actions = getMessageActions(relay, body, media);
  for (let action of actions) {
    await KernelController.applyAction(tripId, action);
    await NotifyController.notifyAction(tripId, action);
  }
  return true;
}

const TwilioMessageHandler = {
  handleIncomingMessage
};

module.exports = TwilioMessageHandler;
