const _ = require('lodash');

const config = require('../config');
const models = require('../models');
const RelayController = require('./relay');
const RelaysController = require('./relays');

const logger = config.logger.child({ name: 'controllers.trip_relays' });

const TripRelaysController = {};

/**
 * Get the user phone number for a relay spec -- either blank if its a
 * trailhead, null if the user wasn't found, or a phone number.
 */
TripRelaysController.userPhoneNumberForRelay = async (trip, relaySpec) => {
  // Find the participant and user for this trip and relay spec.
  const participant = await models.Participant.find({
    where: { roleName: relaySpec.for, tripId: trip.id },
    include: [{ model: models.User, as: 'user' }]
  });
  // Can't create or find a relay for a user without a phone number, so skip
  // this relay without creating it.
  if (!_.get(participant, 'user.phoneNumber')) {
    return null;
  }
  return participant.user.phoneNumber;
};

/**
 * Ensure a relay exists for a given spec and script.
 */
TripRelaysController.ensureRelay = async (trip, scriptName, relaySpec) => {
  // If it's a trailhead, look for a universal relay.
  if (relaySpec.trailhead) {
    return await (
      RelaysController.ensureRelay(
        scriptName, trip.departureName, relaySpec, ''
      )
    );
  }
  // Otherwise, look up the user phone number for a relay.
  const userPhoneNumber = await (
    TripRelaysController.userPhoneNumberForRelay(trip, relaySpec)
  );
  // If no participant was found, or the participant doesn't have a phone
  // number, then we can't create a relay, so we have to return null.
  if (userPhoneNumber === null) {
    return null;
  }
  // If we have a phone number, then we can ensure a relay exists for that
  // number.
  return await (
    RelaysController.ensureRelay(
      scriptName, trip.departureName, relaySpec, userPhoneNumber
    )
  );
};

/**
 * Get relays matching a search pattern. Create them if they don't exist.
 */
TripRelaysController.ensureRelays = async (trip, specFilters, specType) => {
  const script = await models.Script.findById(trip.scriptId);

  // Get specs that match the filters and also the type we're looking for.
  const relaySpecs = _(script.content.relays)
    // Relay specs do not require an 'as' entry, so fill it in when testing.
    .filter(relaySpec => _.isMatch(
      Object.assign({}, relaySpec, { as: relaySpec.as || relaySpec.for }),
      specFilters
    ))
    .filter(relaySpec => relaySpec[specType] === true)
    .value();

  // Ensure all relays exist.
  const relays = await Promise.all(relaySpecs.map(relaySpec => (
    TripRelaysController.ensureRelay(trip, script.name, relaySpec))
  ));

  // Filter out null responses returned for users w/no phone numbers.
  return relays.filter(Boolean);
};

/**
 * Initiate a call.
 */
TripRelaysController.initiateCall = async (
  trip, toRoleName, asRoleName, detectVoicemail
) => {
  const relayFilters = { as: toRoleName, with: asRoleName };
  const relays = await (
    TripRelaysController.ensureRelays(trip, relayFilters, 'phone_out')
  );
  // Check for relay
  if (!relays.length) {
    logger.warn(`No phone relays as ${toRoleName} with ${asRoleName}.`);
    return;
  }
  const relay = relays[0];
  // Get participant for this trip.
  const participant = await models.Participant.find({
    where: { tripId: trip.id, roleName: relay.forRoleName },
    include: [{ model: models.User, as: 'user' }]
  });
  if (!participant) {
    logger.warn(`Relay ${relay.id} has no participant.`);
    return;
  }
  await RelayController.initiateCall(relay, participant, detectVoicemail);
};

/**
 * Send an admin message via admin relays.
 */
TripRelaysController.sendAdminMessage = async (
  trip, toRoleName, messageText
) => {
  const adminRelays = await (
    TripRelaysController.ensureRelays(trip, { for: toRoleName }, 'admin_out')
  );
  for (let relay of adminRelays) {
    const adminMessageText = `[Admin] ${messageText}`;
    await RelayController.sendMessage(relay, trip, adminMessageText, null);
  }
};

/**
 * Format a text message.
 */
async function formatMessageBody(trip, message, includeMeta) {
  if (!includeMeta) {
    return message.messageContent;
  }
  // For text messges, add some debug text if we're sending it to
  // an actor role.
  const stage = config.env.STAGE === 'production' ?
    '' : `${config.env.STAGE[0].toUpperCase()}${config.env.STAGE.substr(1)} `;
  const sentBy = await models.Participant.findById(message.sentById);
  const sentTo = await models.Participant.findById(message.sentToId);
  const contentPrefix = (
    `[${stage}${trip.departureName}] ` +
    `${sentBy.roleName} to ${sentTo.roleName}:`
  );
  return `${contentPrefix} ${message.messageContent}`;
}

/**
 * Format a media url.
 */
function formatMediaUrl(script, url) {
  if (_.startsWith(url, 'http')) {
    return url;
  }
  const mediaHost = config.env.TWILIO_MEDIA_HOST;
  return `${mediaHost}/${script.name}/${url}`;
}

const ALLOWED_MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'mp3', 'mp4'];

/**
 * Split a message into body and media for a given relay.
 */
TripRelaysController.partsForRelayMessage = async (trip, relay, message) => {
  const script = await trip.getScript();
  if (message.messageType === 'text') {
    // Otherwise send the raw content as-is.
    // Include SMS metadata if this relay is for an actor.
    const forRole = _.find(script.content.roles, { name: relay.forRoleName });
    const includeMeta = !!forRole.actor;
    const body = await formatMessageBody(trip, message, includeMeta);
    return [body, null];
  }
  // Send media for media message types.
  if (message.messageType === 'image' ||
      message.messageType === 'audio' ||
      message.messageType === 'video') {
    const ext = message.messageContent.split('.').reverse()[0].toLowerCase();
    const isAllowedMediaExtension = _.includes(ALLOWED_MEDIA_EXTENSIONS, ext);
    if (isAllowedMediaExtension) {
      const mediaUrl = formatMediaUrl(script, message.messageContent);
      return [null, mediaUrl];
    }
  }
  return [null, null];
};

/**
 * Send out a message via relays.
 */
TripRelaysController.relayMessage = async (trip, message, suppressRelayId) => {
  const script = await trip.getScript();
  const sentBy = await models.Participant.findById(message.sentById);
  const sentTo = await models.Participant.findById(message.sentToId);

  // Send to forward relays -- relays as the role receiving the message.
  const forwardFilters = { as: sentTo.roleName, with: sentBy.roleName };
  const forwardRelays = await (
    TripRelaysController.ensureRelays(trip, forwardFilters, 'sms_out')
  );
  for (let relay of forwardRelays) {
    if (relay.id === suppressRelayId) {
      continue;
    }
    const [body, mediaUrl] = await (
      TripRelaysController.partsForRelayMessage(trip, relay, message)
    );
    await RelayController.sendMessage(relay, trip, body, mediaUrl);
  }

  // Send to inverse relays -- relays as the role sending the message. These
  // should only send if the relay is for an actor, otherwise the player
  // may get texts if they use an in-game interface to send a message.
  const inverseFilters = { as: sentBy.roleName, with: sentTo.roleName };
  const inverseRelays = await (
    TripRelaysController.ensureRelays(trip, inverseFilters, 'sms_out')
  );
  for (let relay of inverseRelays) {
    if (relay.id === suppressRelayId) {
      continue;
    }
    // If the inverse relay is not for an actor, skip sending the message.
    // Only actors get notified if another user sent a message as the
    // same role.
    const forRole = _.find(script.content.roles, { name: relay.forRoleName });
    if (!forRole.actor) {
      continue;
    }
    const [body, mediaUrl] = await (
      TripRelaysController.partsForRelayMessage(trip, relay, message)
    );
    await RelayController.sendMessage(relay, trip, body, mediaUrl);
  }
};

module.exports = TripRelaysController;
