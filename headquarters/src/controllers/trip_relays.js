const _ = require('lodash');
const config = require('../config');
const models = require('../models');

const RelayController = require('./relay');

const logger = config.logger.child({ name: 'controllers.trip_relays' });

const TripRelaysController = {};

/**
 * Get relays matching a search pattern.
 */
TripRelaysController.getRelays = async (trip, filters, specType) => {
  const script = await models.Script.findById(trip.scriptId);
  // Find relays
  const relays = await models.Relay.findAll({
    where: Object.assign({
      stage: config.env.STAGE,
      scriptName: script.name,
      isActive: true,
      departureName: trip.departureName,
    }, filters)
  });
  // And filter by each specFilter
  return relays.filter((relay) => {
    const relaySpec = RelayController.specForRelay(script, relay);
    return relaySpec && relaySpec[specType] === true;
  });
};

/**
 * Initiate a call.
 */
TripRelaysController.initiateCall = async (
  trip, toRoleName, asRoleName, detectVoicemail
) => {
  const relayFilters = { asRoleName: toRoleName, withRoleName: asRoleName };
  const relays = await (
    TripRelaysController.getRelays(trip, relayFilters, 'phone_out')
  );
  // Check for relay
  if (!relays.length) {
    logger.warn(`No phone relays as ${toRoleName} with ${asRoleName}.`);
    return;
  }
  const relay = relays[0];
  // Get participant for this playthrough.
  const participant = await models.Participant.find({
    where: { playthroughId: trip.id, roleName: relay.forRoleName },
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
  const adminFilters = { forRoleName: toRoleName };
  const adminRelays = await (
    TripRelaysController.getRelays(trip, adminFilters, 'admin_out')
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
  const forwardFilters = {
    asRoleName: sentTo.roleName,
    withRoleName: sentBy.roleName
  };
  const forwardRelays = await (
    TripRelaysController.getRelays(trip, forwardFilters, 'sms_out')
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
  const inverseFilters = {
    asRoleName: sentBy.roleName,
    withRoleName: sentTo.roleName
  };
  const inverseRelays = await (
    TripRelaysController.getRelays(trip, inverseFilters, 'sms_out')
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
