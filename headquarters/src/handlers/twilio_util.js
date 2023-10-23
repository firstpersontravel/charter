const moment = require('moment');
const url = require('url');

const models = require('../models');
const config = require('../config');

const RelayController = require('../controllers/relay');
const EntrywayController = require('../controllers/entryway');
const TripResetHandler = require('./trip_reset');

var logger = config.logger.child({ name: 'handlers.twilio_util' });

const stagesByHost = {
  'app.firstperson.travel': 'production',
  'charter.firstperson.travel': 'production',
  'beta.firstperson.travel': 'staging',
  'staging.firstperson.travel': 'staging',
  'firstpersontravel.ngrok.io': 'development',
  'fpt.ngrok.io': 'development'
};

// Primary host by stage
const hostsByStage = {
  production: 'charter.firstperson.travel',
  staging: 'beta.firstperson.travel',
  development: 'fpt.ngrok.io'
};

function truncate(s, len) {
  if (s.length > len) {
    return s.slice(0, len - 2) + '..';
  }
  return s;
}

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
    if (relay.participantPhoneNumber !== '') {
      logger.warn(`Relay ${relay.id} is not an entryway; can't create a new trip.`);
      return null;
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

  static async pruneNumbers({ deleteRelays, deleteNumbers, updateHosts, limit, cullThreshold }) {
    const twilioClient = config.getTwilioClient();
    if (!twilioClient) {
      logger.error('No twilio client configured.');
      return;
    }

    const cullThresholdDays = cullThreshold ? Number(cullThreshold) : 30;
    const cullThresholdSecs = cullThresholdDays * 86400;
    const cullThresholdTime = moment().subtract(cullThresholdSecs, 's');
    const allNumbers = await twilioClient.incomingPhoneNumbers.list();
    const allRelays = await models.Relay.findAll({
      include: [
        {
          model: models.Org,
          as: 'org',
          where: { isPaid: false } // Only cull relays for free numbers
        },
        { model: models.Experience, as: 'experience' }
      ]
    });
  
    const relaysToCull = [];
    const numbersToCull = [];
    const numbersToUpdate = [];
    const accountedRelayIds = new Set();
    for (const number of allNumbers) {
      let shouldCull = true;
      const host = url.parse(number.smsUrl).host;
      const stage = stagesByHost[host];
      if (!stage) {
        logger.info(`${number.phoneNumber}: unrecognized host "${host}".`);
        continue;
      }
      const shouldUpdateHost = host !== hostsByStage[stage];
      const relays = allRelays.filter(r => (
        r.stage === stage && r.relayPhoneNumber === number.phoneNumber
      ));
      const numEntryways = relays.filter(r => !r.participantPhoneNumber).length;
      const numDynamic = relays.filter(r => r.participantPhoneNumber).length;
      relays.forEach(r => accountedRelayIds.add(r.id));
      let expText = '-'.padEnd(71);
      if (relays.length > 0) {
        const relay = relays[0];
        expText = (
          `${relay.org.title.padEnd(25)} | ` +
          `${truncate(relay.experience.title, 20).padEnd(20)}`
        );
        if (relay.experience.isArchived) {
          expText += ` | ${'*Archived*'.padEnd(20)}`;
        } else {
          const lastTrip = await models.Trip.findOne({
            where: { experienceId: relay.experienceId },
            order: [['updatedAt', 'desc']]
          });
          if (lastTrip) {
            const updatedAt = moment(lastTrip.updatedAt);
            expText += ` | ${updatedAt.fromNow().padEnd(20)}`;
            if (updatedAt.isAfter(cullThresholdTime)) {
              shouldCull = false;
            }
          }
        }
      }
      let disposition = '-';
      if (shouldCull) {
        disposition = 'CULL';
      } else if (shouldUpdateHost) {
        disposition = 'UPDATE HOST';
      }
      
      const shouldSkip = stage != config.env.HQ_STAGE;
  
      logger.info(
        `${number.phoneNumber} | ${stage.padEnd(11)} | ` +
        `${numEntryways} entry | ` +
        `${numDynamic.toString().padEnd(2)} dyn | ` +
        `${expText} | ${disposition}${shouldSkip ? ' (skip)' : ''}`);
  
      if (!shouldSkip) {
        if (shouldCull) {
          relaysToCull.push(...relays);
          numbersToCull.push(number);
        } else if (shouldUpdateHost) {
          numbersToUpdate.push([number, stage]);
        }
      }
    }
  
    for (const relay of allRelays) {
      if (accountedRelayIds.has(relay.id)) {
        continue;
      }
      logger.info(
        `Relay w/no number in ${relay.stage}: #${relay.id}: ` +
        `${relay.relayPhoneNumber}`);
      relaysToCull.push(relay);
    }
  
    logger.info('');
    logger.info('Proposed action:');
    if (relaysToCull.length) {
      logger.info(`- Delete ${relaysToCull.length} relays`);
    }
    if (numbersToCull.length) {
      logger.info(`- Delete ${numbersToCull.length} numbers`);
    }
    if (numbersToUpdate.length) {
      logger.info(`- Update host for ${numbersToUpdate.length} numbers`);
    }
  
    if (deleteRelays || deleteNumbers || updateHosts) {
      const opmax = Number(limit || 0);
      logger.info('');
      logger.info('Executed:');
  
      if (deleteRelays) {
        for (const relayToCull of relaysToCull.slice(0, opmax)) {
          await relayToCull.destroy();
          logger.info(`- Deleted relay #${relayToCull.id}`);
        }
      }
  
      if (deleteNumbers) {
        for (const numberToCull of numbersToCull.slice(0, opmax)) {
          await numberToCull.remove();
          logger.info(`- Deleted ${numberToCull.phoneNumber}`);
        }
      }
      if (updateHosts) {
        for (const [numberToUpdate, stage] of numbersToUpdate.slice(0, opmax)) {
          const proto = stage === 'development' ? 'http://' : 'https://';
          const host = `${proto}${hostsByStage[stage]}`;
          await numberToUpdate.update({
            voiceUrl: `${host}/endpoints/twilio/calls/incoming`,
            statusCallback: `${host}/endpoints/twilio/calls/incoming_status`,
            smsUrl: `${host}/endpoints/twilio/messages/incoming`
          });
          logger.info(`- Updated ${numberToUpdate.phoneNumber} to ${host}.`);
        }
      }
    }
  }
}

module.exports = TwilioUtil;
