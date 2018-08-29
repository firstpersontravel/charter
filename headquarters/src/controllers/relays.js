const _ = require('lodash');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.relays' });

/**
// Sample node console code for updating phone numbers

const config = require('./src/config');
const hosts = {
  staging: 'https://staging.firstperson.travel',
  production: 'https://app.firstperson.travel',
  local: 'http://firstpersontravel.ngrok.io'
};

function getStage(num) {
  if (num.smsUrl.indexOf('staging.theheadlands') > -1) { return 'staging'; }
  if (num.smsUrl.indexOf('staging.firstperson') > -1) { return 'staging'; }
  if (num.smsUrl.indexOf('travel.theheadlands') > -1) { return 'production'; }
  if (num.smsUrl.indexOf('app.firstperson') > -1) { return 'production'; }
  if (num.smsUrl.indexOf('ngrok.io') > -1) { return 'development'; }
  return '';
}

async function updateNum(num) {
  const host = hosts[getStage(num)];
  if (!host) { return; }
  await num.update({
    voiceUrl: `${host}/endpoints/twilio/calls/incoming`,
    statusCallback: `${host}/endpoints/twilio/calls/incoming_status`,
    smsUrl: `${host}/endpoints/twilio/messages/incoming`
  });
}

config.getTwilioClient().incomingPhoneNumbers.list().then((nums) => {
  for (let num of nums) {
    console.log(num.phoneNumber, num.smsUrl, getStage(num));
  }
});

config.getTwilioClient().incomingPhoneNumbers.list().then(async (nums) => {
  for (let num of nums) {
    console.log(num.phoneNumber, num.smsUrl, getStage(num));
    await updateNum(num);
  }
});
*/

async function purchaseNumber() {
  const availableNumbers = await config
    .getTwilioClient()
    .availablePhoneNumbers('US')
    .local
    .list({ areaCode: '707' });
  if (!availableNumbers.length) {
    throw new Error('No numbers available for purchase.');
  }
  const availableNumber = availableNumbers[0];
  const purchasedNumber = await config
    .getTwilioClient()
    .incomingPhoneNumbers
    .create({ phoneNumber: availableNumber.phoneNumber });

  const twilioHost = config.env.TWILIO_HOST;
  const updatedNumber = await purchasedNumber.update({
    voiceUrl: `${twilioHost}/endpoints/twilio/calls/incoming`,
    statusCallback: `${twilioHost}/endpoints/twilio/calls/incoming_status`,
    smsUrl: `${twilioHost}/endpoints/twilio/messages/incoming`
  });
  logger.warn(`Purchased ${updatedNumber.phoneNumber}.`);
  return updatedNumber.phoneNumber.replace('+1', '');
}

function getOverlappingRelayFilters(role, relaySpec, departureName) {
  // Look for relays for this role
  const usedRelayFilters = { stage: config.env.STAGE };
  // Filter more finely, unless we allow trip creation via this
  // channel - then you need a fresh number for each one.
  if (!relaySpec.trailhead) {
    usedRelayFilters.forRoleName = role.name;
    // If you aren't an actor, allow duplicating across schedules, since
    // each non-actor will be at only one schedule at a time. But if you are
    // an actor, don't filter by schedule name to make sure that one number
    // is assigned to each role for each schedule.
    if (!role.actor) {
      usedRelayFilters.departureName = departureName;
    }
  }
  return usedRelayFilters;
}

async function assignRelayNumber(existingNumbers, existingRelays, forRole,
  relaySpec, departureName) {
  // Look for filters that overlap and get their numbers.
  const usedRelayFilters = getOverlappingRelayFilters(
    forRole, relaySpec, departureName);
  const usedRelays = _.filter(existingRelays, usedRelayFilters);
  const usedNumbers = usedRelays.map(relay => `+1${relay.phoneNumber}`);
  const unusedNumbers = _.difference(existingNumbers, usedNumbers);
  // If we have an avail number, use it.
  if (unusedNumbers.length > 0) {
    return unusedNumbers[0].replace('+1', '');
  }
  // Otherwise purchase one.
  return await purchaseNumber();
}

async function createForScript(scriptId) {
  if (!config.getTwilioClient()) {
    return;
  }
  const twilioHost = config.env.TWILIO_HOST;
  const script = await models.Script.findById(scriptId);
  const existingRelays = await models.Relay.findAll({
    where: { stage: config.env.STAGE }
  });
  const allExistingNumbers = await (
    config.getTwilioClient().incomingPhoneNumbers.list()
  );

  // Filter all existing numbers by matching host.
  // and filter out all numbers currently used by another script.
  const existingNumbers = allExistingNumbers
    .filter(num => num.smsUrl.indexOf(twilioHost) > -1)
    .filter(num => {
      // Get all relays with this number
      const relaysWithNumber = existingRelays.filter(relay => (
        num.phoneNumber === `+1${relay.phoneNumber}`
      ));
      // If no relays are currently assigned this number, it's ok.
      if (!relaysWithNumber.length) {
        return true;
      }
      // If some are assigned, they should all be the same script. If not,
      // skip this -- don't want any overlap.
      const relayScriptIds = _.uniq(_.map(relaysWithNumber, 'scriptId'));
      return _.every(relayScriptIds, relayScriptId => (
        relayScriptId === scriptId)
      );
    })
    .map(num => num.phoneNumber);

  // Iterate through each departure, role and relay spec, and either find
  // or create a relay.
  for (let departure of script.content.departures) {
    for (let relaySpec of (script.content.relays || [])) {
      // Find matching relays that already exist
      const matchingRelays = _.filter(existingRelays, {
        scriptName: script.name,
        departureName: departure.name,
        forRoleName: relaySpec.for,
        withRoleName: relaySpec.with,
        asRoleName: relaySpec.as || relaySpec.for
      });

      // If any exist, return early
      if (matchingRelays.length > 0) {
        logger.info(
          `${script.name} ${departure.name} | ` +
          `${relaySpec.for} - ${relaySpec.with} ` +
          `as ${relaySpec.as || relaySpec.for}: ` +
          `exists as ${matchingRelays[0].phoneNumber}`);
        continue;
      }

      // If none exist, create one
      const role = _.find(script.content.roles, { name: relaySpec.for });
      const phoneNumber = await assignRelayNumber(
        existingNumbers, existingRelays, role,
        relaySpec, departure.name);

      // Log creation
      logger.info(
        `${script.name} ${departure.name} | ` +
        `${role.name} - ${relaySpec.with} ` +
        `as ${relaySpec.as || role.name}: ` +
        `assigned as ${phoneNumber}`);

      // Create
      const newRelay = await models.Relay.create({
        stage: config.env.STAGE,
        scriptName: script.name,
        departureName: departure.name,
        forRoleName: role.name,
        withRoleName: relaySpec.with,
        asRoleName: relaySpec.as || role.name,
        phoneNumber: phoneNumber,
        isActive: true
      });
      existingRelays.push(newRelay);
    }
  }
}

async function participantForRelayAndUserNumber(relay, userNumber) {
  return await models.Participant.find({
    where: { roleName: relay.forRoleName },
    include: [{
      model: models.User,
      as: 'user',
      where: { phoneNumber: userNumber }
    }, {
      model: models.Playthrough,
      as: 'playthrough',
      where: {
        departureName: relay.departureName,
        isArchived: false
      },
      include: [{
        model: models.Script,
        as: 'script',
        where: {
          name: relay.scriptName
        }
      }]
    }]
  });
}

async function findWithParticipantByNumber(relayNumber, userNumber) {
  const relays = await models.Relay.findAll({
    where: {
      stage: config.env.STAGE,
      phoneNumber: relayNumber,
      isActive: true
    }
  });

  for (let relay of relays) {
    const participant = await (
      participantForRelayAndUserNumber(relay, userNumber)
    );
    // If we found an existing matching participant, we're good.
    if (participant) {
      return [relay, participant];
    }
  }

  // If we made it here, there were no relays with participants. So let's
  // look for trailheads.
  for (let relay of relays) {
    const script = await models.Script.find({
      where: { name: relay.scriptName }
    });
    const relaySpec = _.find(script.content.relays, r => (
      r.for === relay.forRoleName &&
      r.with === relay.withRoleName &&
      (r.as || r.for) === relay.asRoleName
    ));
    // If we can't find a relay, it must have been removed from the script.
    if (!relaySpec) {
      continue;
    }
    // If we allow trip creation via this relay, then we allow
    // a return even if there is no participant. This is because
    // this relay must have a unique number and therefore we know
    // we need to create a new playthrough and participant.
    if (relaySpec.trailhead) {
      return [relay, null];
    }
    // If no existing participant and doesn't allow trip creation,
    // then this relay doesn't match. Continue to the next
  }

  // If we made it to the end, no relay matched.
  return [null, null];
}

const RelaysController = {
  createForScript: createForScript,
  findWithParticipantByNumber: findWithParticipantByNumber
};

module.exports = RelaysController;
