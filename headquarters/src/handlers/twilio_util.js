const Sequelize = require('sequelize');

const config = require('../config.ts');
const models = require('../models');

const EntrywayController = require('../controllers/entryway');
const ExperienceController = require('../controllers/experience');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TripResetHandler = require('./trip_reset');

var logger = config.logger.child({ name: 'handlers.twilio_util' });

class TwilioUtil {
  static async sendCharterDefaultEntrywayMessage(relayService, toNumber) {
    await config.getTwilioClient().messages.create({
      to: toNumber,
      messagingServiceSid: relayService.sid,
      body: RelaysController.getDefaultWelcome()
    });
  }

  static async getRelayForExistingOrNewTrip(relayNumber, forNumber, messageBody) {
    let existingRelay = await RelaysController.findByNumber(relayNumber, forNumber);
    if (existingRelay) {
      return existingRelay;
    }
    // If we can't find an associated relay, look for a service and/or entryway.
    const relayService = await models.RelayService.findOne({
      where: { stage: config.env.HQ_STAGE, phoneNumber: relayNumber }
    });
    // If no associated relay or service is found, then we have no idea why we're getting this
    // message and return nothing.
    if (!relayService) {
      logger.warn('Message relay service not found.');
      return null;
    }
    // Continue on inactive relay services since we want to allow validating them with twilio.
    if (!relayService.isActive) {
      logger.warn('Message relay service is inactive.');
    }
    // Search for matching entryways
    const entrywayKeywords = [''];
    if (messageBody) {
      entrywayKeywords.push(messageBody.split(' ')[0].toLowerCase());
    }
    const relayEntryway = await models.RelayEntryway.findOne({
      where: {
        relayServiceId: relayService.id,
        keyword: { [Sequelize.Op.or]: entrywayKeywords }
      },
      // Sort by descending keyword to put matching keyword first (preferred), empty second
      order: [['keyword', 'DESC']]
    });
    // If we found a service but no entryways, just return a charter default message, but don't continue.
    if (!relayEntryway) {
      logger.warn('No associated entryway found for this relay service.');
      await this.sendCharterDefaultEntrywayMessage(relayService, forNumber);
      return null;
    }
  
    // If we found a service and an associated entryway, then we send the entryway's welcome message,
    // associate a new relay, and proceed!
    const script = await ExperienceController.findActiveScript(relayEntryway.experienceId);
    const entrywayRelaySpec = RelayController.getEntrywayRelaySpec(script);
    if (!entrywayRelaySpec) {
      logger.warn('No associated entryway spec found in this script.');
      await this.sendCharterDefaultEntrywayMessage(relayService, forNumber);
      return null;
    }

    // Create trip and initialize it
    const trip = await EntrywayController.createTripFromEntryway(script, entrywayRelaySpec.for, forNumber);
    await TripResetHandler.resetToStart(trip.id);
    
    // Create relay for trip
    const newRelay = await RelaysController.createRelayFromIncoming(relayService, relayEntryway, entrywayRelaySpec, trip, forNumber);

    // Send welcome message
    await RelaysController.sendWelcome(relayEntryway, newRelay);

    return newRelay;
  }
}

module.exports = TwilioUtil;
