const moment = require('moment');

const config = require('../config');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const RelayController = require('../controllers/relay');
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
  const relay = await TwilioUtil.getRelayForExistingOrNewTrip(toNumber, fromNumber, body);

  // If relay service wasn't found for this to number, which shouldn't really happen.
  if (!relay) {
    logger.warn(`No relay service found matching ${toNumber}.`);
    return false;
  }
  
  // If relay doesn't have a spec in the associated experience, return
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

  // Set last active for the relay.
  await relay.update({
    lastActiveAt: moment.utc()
  });

  // And apply trip actions based on the message.
  const actions = getMessageActions(relay, body, media);
  for (let action of actions) {
    await KernelController.applyAction(relay.tripId, action);
    await NotifyController.notifyAction(relay.tripId, action);
  }
  return true;
}

const TwilioMessageHandler = {
  handleIncomingMessage
};

module.exports = TwilioMessageHandler;
