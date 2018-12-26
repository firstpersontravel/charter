const _ = require('lodash');

const config = require('../config');
const models = require('../models');
const RelayController = require('./relay');
const RelaysController = require('./relays');

const logger = config.logger.child({ name: 'controllers.trip_relays' });

const ALLOWED_MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'mp3', 'mp4'];

class TripRelaysController {
  /**
   * Get the user phone number for a relay spec -- either blank if its a
   * trailhead, null if the user wasn't found, or a phone number.
   */
  static async userNumberForRelay(trip, relaySpec) {
    // Find the player and user for this trip and relay spec.
    const player = await models.Player.find({
      where: { roleName: relaySpec.for, tripId: trip.id },
      include: [{ model: models.User, as: 'user' }]
    });
    // Can't create or find a relay for a user without a phone number, so skip
    // this relay without creating it.
    if (!_.get(player, 'user.phoneNumber')) {
      return null;
    }
    return player.user.phoneNumber;
  }

  /**
   * Ensure a relay exists for a given spec and script.
   */
  static async ensureRelay(trip, scriptName, relaySpec) {
    // If it's a trailhead, look for a universal relay.
    if (relaySpec.trailhead) {
      return await RelaysController.ensureRelay(scriptName, trip.departureName,
        relaySpec, '');
    }
    // Otherwise, look up the user phone number for a relay.
    const userPhoneNumber = await this.userNumberForRelay(trip, relaySpec);
    // If no player was found, or the player doesn't have a phone
    // number, then we can't create a relay, so we have to return null.
    if (userPhoneNumber === null) {
      return null;
    }
    // If we have a phone number, then we can ensure a relay exists for that
    // number.
    return await RelaysController.ensureRelay(scriptName, trip.departureName,
      relaySpec, userPhoneNumber);
  }

  /**
   * Get relays matching a search pattern. Create them if they don't exist.
   */
  static async ensureRelays(trip, specFilters, specType) {
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
      this.ensureRelay(trip, script.name, relaySpec))
    ));

    // Filter out null responses returned for users w/no phone numbers.
    return relays.filter(Boolean);
  }

  /**
   * Initiate a call.
   */
  static async initiateCall(trip, toRoleName, asRoleName, detectVoicemail) {
    const relayFilters = { as: toRoleName, with: asRoleName };
    const relays = await this.ensureRelays(trip, relayFilters, 'phone_out');

    // Check for relay
    if (!relays.length) {
      logger.warn(`No phone relays as ${toRoleName} with ${asRoleName}.`);
      return;
    }
    const relay = relays[0];
    // Get player for this trip.
    const player = await models.Player.find({
      where: { tripId: trip.id, roleName: relay.forRoleName },
      include: [{ model: models.User, as: 'user' }]
    });
    if (!player) {
      logger.warn(`Relay ${relay.id} has no player.`);
      return;
    }
    await RelayController.initiateCall(relay, player, detectVoicemail);
  }

  /**
   * Send an admin message via admin relays.
   */
  static async sendAdminMessage(trip, toRoleName, messageText) {
    const adminFilters = { for: toRoleName };
    const relays = await this.ensureRelays(trip, adminFilters, 'admin_out');
    for (let relay of relays) {
      const adminMessageText = `[Admin] ${messageText}`;
      await RelayController.sendMessage(relay, trip, adminMessageText, null);
    }
  }

  /**
   * Format a text message.
   * TODO: THIS CAN NOT BE ASYNC ONCE MESSAGE HAS ROLE_NAME
   */
  static async _formatMessageBody(trip, message, includeMeta) {
    if (!includeMeta) {
      return message.messageContent;
    }
    // For text messges, add some debug text if we're sending it to
    // an actor role.
    const stage = config.env.STAGE === 'production' ?
      '' : `${config.env.STAGE[0].toUpperCase()}${config.env.STAGE.substr(1)} `;
    const sentBy = await models.Player.findById(message.sentById);
    const sentTo = await models.Player.findById(message.sentToId);
    const contentPrefix = (
      `[${stage}${trip.departureName}] ` +
      `${sentBy.roleName} to ${sentTo.roleName}:`
    );
    return `${contentPrefix} ${message.messageContent}`;
  }

  /**
   * Format a media url.
   */
  static _formatMediaUrl(script, url) {
    if (_.startsWith(url, 'http')) {
      return url;
    }
    const mediaHost = config.env.TWILIO_MEDIA_HOST;
    return `${mediaHost}/${script.name}/${url}`;
  }

  /**
   * Split a message into body and media for a given relay.
   * TODO: THIS CAN NOT BE ASYNC ONCE MESSAGE HAS ROLE_NAME
   */
  static async _partsForRelayMessage(trip, relay, message) {
    const script = await trip.getScript();

    if (message.messageType === 'text') {
      // Otherwise send the raw content as-is.
      // Include SMS metadata if this relay is for an actor.
      const forRole = _.find(script.content.roles, { name: relay.forRoleName });
      const includeMeta = !!forRole.actor;
      const body = await this._formatMessageBody(trip, message, includeMeta);
      return [body, null];
    }

    // Send media for media message types.
    if (message.messageType === 'image' ||
        message.messageType === 'audio' ||
        message.messageType === 'video') {
      const ext = message.messageContent.split('.').reverse()[0].toLowerCase();
      const isAllowedMediaExtension = _.includes(ALLOWED_MEDIA_EXTENSIONS, ext);
      if (isAllowedMediaExtension) {
        const mediaUrl = this._formatMediaUrl(script, message.messageContent);
        return [null, mediaUrl];
      }
    }

    return [null, null];
  }

  /**
   * Send out a message via relays.
   */
  static async relayMessage(trip, message, suppressRelayId) {
    const script = await trip.getScript();
    const sentBy = await models.Player.findById(message.sentById);
    const sentTo = await models.Player.findById(message.sentToId);

    // Send to forward relays -- relays as the role receiving the message.
    const fwdFilters = { as: sentTo.roleName, with: sentBy.roleName };
    const fwdRelays = await this.ensureRelays(trip, fwdFilters, 'sms_out');

    for (let relay of fwdRelays) {
      if (relay.id === suppressRelayId) {
        continue;
      }
      const [body, mediaUrl] = await (
        this._partsForRelayMessage(trip, relay, message)
      );
      await RelayController.sendMessage(relay, trip, body, mediaUrl);
    }

    // Send to inverse relays -- relays as the role sending the message. These
    // should only send if the relay is for an actor, otherwise the player
    // may get texts if they use an in-game interface to send a message.
    const invFilters = { as: sentBy.roleName, with: sentTo.roleName };
    const invRelays = await this.ensureRelays(trip, invFilters, 'sms_out');

    for (let relay of invRelays) {
      if (relay.id === suppressRelayId) {
        continue;
      }
      // If the inv relay is not for an actor, skip sending the message.
      // Only actors get notified if another user sent a message as the
      // same role.
      const role = _.find(script.content.roles, { name: relay.forRoleName });
      if (!role.actor) {
        continue;
      }
      const [body, mediaUrl] = await this._partsForRelayMessage(trip, relay, 
        message);
      await RelayController.sendMessage(relay, trip, body, mediaUrl);
    }
  }
}

module.exports = TripRelaysController;
