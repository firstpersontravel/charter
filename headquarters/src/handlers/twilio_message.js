const config = require('../config');
const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const RelayController = require('../controllers/relay');
const RelayTrailheadController = require('../controllers/relay_trailhead');
const RelaysController = require('../controllers/relays');

var logger = config.logger.child({ name: 'handlers.twilio' });

function getMessageActions(relay, body, media) {
  const actions = [];
  // Message text
  if (body) {
    actions.push({
      name: 'send_message',
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
    name: 'send_message',
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

async function handleIncomingMessage(fromNumber, toNumber, body, media) {
  const [relay, participant] = await (
    RelaysController.findWithParticipantByNumber(toNumber, fromNumber)
  );

  // No action if we can't find the right relay
  if (!relay) {
    logger.warn('Message target relay not found.');
    return null;
  }

  // Or if relay isn't an SMS relay.
  const script = await RelayController.scriptForRelay(relay);
  if (!script) {
    logger.warn('Message target script not found.');
    return null;
  }

  const relaySpec = RelayController.specForRelay(script, relay);
  if (!relaySpec.sms_in) {
    logger.warn(`Relay ${relay.id} does not accept incoming SMS.`);
    return null;
  }

  // Get the playthrough id.
  let playthroughId = participant ? participant.playthroughId : null;

  // Create the playthrough if this is a brand new game created from
  // a trailhead.
  if (!participant) {
    logger.info('Creating new playthrough for this trailhead!');
    const playthrough = await RelayTrailheadController.createTrip(
      relay, fromNumber);
    playthroughId = playthrough.id;
  }

  // Whether it's a trailhead or not, 
  const actions = getMessageActions(relay, body, media);
  for (let action of actions) {
    await TripActionController.applyAction(playthroughId, action);
    await TripNotifyController.notifyAction(playthroughId, action);
  }
}

const TwilioMessageHandler = {
  handleIncomingMessage
};

module.exports = TwilioMessageHandler;
