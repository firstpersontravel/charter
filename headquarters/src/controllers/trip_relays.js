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
   * entryway, null if the user wasn't found, or a phone number.
   */
  static async userNumberForRelay(trip, relaySpec) {
    // Find the player and user for this trip and relay spec.
    const player = await models.Player.findOne({
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
  static async ensureRelay(trip, relaySpec) {
    // If it's a entryway, look for a universal relay.
    if (relaySpec.entryway) {
      return await RelaysController.ensureRelay(trip.orgId, trip.experienceId,
        null, relaySpec, '');
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
    return await RelaysController.ensureRelay(trip.orgId, trip.experienceId,
      trip.id, relaySpec, userPhoneNumber);
  }

  /**
   * Get relays matching a search pattern. Create them if they don't exist.
   */
  static async ensureRelays(trip, specFilters) {
    const script = await models.Script.findByPk(trip.scriptId);

    // Get specs that match the filters and also the type we're looking for.
    const relaySpecs = _(script.content.relays)
      // Relay specs do not require an 'as' entry, so fill it in when testing.
      .filter(relaySpec => _.isMatch(
        Object.assign({}, relaySpec, { as: relaySpec.as || relaySpec.for }),
        specFilters
      ))
      .value();

    // Ensure all relays exist.
    const relays = await Promise.all(relaySpecs.map(relaySpec => (
      this.ensureRelay(trip, relaySpec))
    ));

    // Filter out null responses returned for users w/no phone numbers.
    return relays.filter(Boolean);
  }

  /**
   * Initiate a call.
   */
  static async initiateCall(trip, toRoleName, asRoleName, detectVoicemail) {
    const relayFilters = { as: toRoleName, with: asRoleName };
    const relays = await this.ensureRelays(trip, relayFilters);

    // Check for relay
    if (!relays.length) {
      logger.warn(`No phone relays as ${toRoleName} with ${asRoleName}.`);
      return;
    }
    const relay = relays[0];
    // Get player for this trip.
    const player = await models.Player.findOne({
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
   * Format a text message.
   */
  static _formatMessageBody(script, trip, message, includeMeta) {
    if (!includeMeta) {
      return message.content;
    }
    // For text messges, add some debug text if we're sending it to
    // an actor role.
    const stage = config.env.HQ_STAGE === 'production' ?
      '' : `${config.env.HQ_STAGE} `;
    const fromRole = script.content.roles
      .find(r => r.name === message.fromRoleName) || { title: '?' };
    const toRole = script.content.roles
      .find(r => r.name === message.toRoleName) || { title: '?' };
    const contentPrefix = (
      `[${stage}${trip.title}] ` +
      `${fromRole.title} to ${toRole.title}:`
    );
    return `${contentPrefix} ${message.content}`;
  }

  /**
   * Format a media url.
   */
  static async _getMediaUrl(trip, url) {
    if (_.startsWith(url, 'http')) {
      return url;
    }
    const asset = await models.Asset.findOne({
      where: {
        experienceId: trip.experienceId,
        type: 'media',
        name: url
      }
    });
    if (!asset) {
      return null;
    }
    return asset.data.url;
  }

  /**
   * Split a message into body and media for a given relay.
   */
  static async _partsForRelayMessage(script, trip, relay, message) {
    if (message.medium === 'text') {
      // TODO: include meta if this user is signed up for multiple active trips
      const includeMeta = false;
      const body = this._formatMessageBody(script, trip, message, includeMeta);
      return [body, null];
    }

    // Send media for media message types.
    if (message.medium === 'image' ||
        message.medium === 'audio' ||
        message.medium === 'video') {
      const ext = message.content.split('.').reverse()[0].toLowerCase();
      const isAllowedMediaExtension = _.includes(ALLOWED_MEDIA_EXTENSIONS, ext);
      if (isAllowedMediaExtension) {
        const mediaUrl = await this._getMediaUrl(trip, message.content);
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

    // Send to forward relays -- relays as the role receiving the message.
    const fwdFilters = { as: message.toRoleName, with: message.fromRoleName };
    const fwdRelays = await this.ensureRelays(trip, fwdFilters);

    for (let relay of fwdRelays) {
      if (relay.id === suppressRelayId) {
        continue;
      }
      const [body, mediaUrl] = await (
        this._partsForRelayMessage(script, trip, relay, message)
      );
      await RelayController.sendMessage(relay, trip, body, mediaUrl);
    }

    // Send to inverse relays -- relays as the role sending the message. These
    // should only send if the relay is for a different role than the one
    // who sent the message -- it's a 'cc' relay. There is no need to notify
    // a role who, for instance, sent a message via the web, of having sent
    // that message, over text.
    const invFilters = { as: message.fromRoleName, with: message.toRoleName };
    const invRelays = await this.ensureRelays(trip, invFilters);

    for (let relay of invRelays) {
      if (relay.id === suppressRelayId) {
        continue;
      }
      // If this relay is for the user who sent the message, skip.
      if (relay.forRoleName === message.fromRoleName) {
        continue;
      }
      const [body, mediaUrl] = await this._partsForRelayMessage(script, trip, 
        relay, message);
      await RelayController.sendMessage(relay, trip, body, mediaUrl);
    }
  }
}

module.exports = TripRelaysController;
