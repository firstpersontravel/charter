const moment = require('moment');
const program = require('commander');
const url = require('url');

const config = require('../src/config');
const models = require('../src/models');

const twilioClient = config.getTwilioClient();
if (!twilioClient) {
  console.log('No twilio client configured.');
  process.exit(1);
}

program
  .option('--delete-relays', 'Delete the relays to be culled.')
  .option('--delete-numbers', 'Delete the twilio numbers to be culled.')
  .option('--update-hosts', 'Update any numbers with outdated hosts.')
  .option('--limit [limit]', 'Limit number of updates')
  .parse(process.argv);

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

const cullThresholdSecs = 86400 * 30; // one month in secs

function truncate(s, len) {
  if (s.length > len) {
    return s.slice(0, len - 2) + '..';
  }
  return s;
}

async function pruneNumbers({ deleteRelays, deleteNumbers, updateHosts,
  limit }) {
  const cullThreshold = moment().subtract(cullThresholdSecs, 's');
  const allNumbers = await twilioClient.incomingPhoneNumbers.list();
  const allRelays = await models.Relay.findAll({
    include: [
      { model: models.Org, as: 'org' },
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
      console.log(`${number.phoneNumber}: unrecognized host "${host}".`);
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
          if (updatedAt.isAfter(cullThreshold)) {
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

    console.log(
      `${number.phoneNumber} | ${stage.padEnd(11)} | ` +
      `${numEntryways} entry | ` +
      `${numDynamic.toString().padEnd(2)} dyn | ` +
      `${expText} | ${disposition}`);

    if (shouldCull) {
      relaysToCull.push(...relays);
      numbersToCull.push(number);
    } else if (shouldUpdateHost) {
      numbersToUpdate.push([number, stage]);
    }
  }

  for (const relay of allRelays) {
    if (accountedRelayIds.has(relay.id)) {
      continue;
    }
    console.log(
      `Relay w/no number in ${relay.stage}: #${relay.id}: ` +
      `${relay.relayPhoneNumber}`);
    relaysToCull.push(relay);
  }

  console.log('');
  console.log('Proposed action:');
  if (relaysToCull.length) {
    console.log(`- Delete ${relaysToCull.length} relays`);
  }
  if (numbersToCull.length) {
    console.log(`- Delete ${numbersToCull.length} numbers`);
  }
  if (numbersToUpdate.length) {
    console.log(`- Update host for ${numbersToUpdate.length} numbers`);
  }

  if (deleteRelays || deleteNumbers || updateHosts) {
    const opmax = Number(limit || 0);
    console.log('');
    console.log('Executed:');

    if (deleteRelays) {
      for (const relayToCull of relaysToCull.slice(0, opmax)) {
        await relayToCull.destroy();
        console.log(`- Deleted relay #${relayToCull.id}`);
      }
    }

    if (deleteNumbers) {
      for (const numberToCull of numbersToCull.slice(0, opmax)) {
        await numberToCull.remove();
        console.log(`- Deleted ${numberToCull.phoneNumber}`);
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
        console.log(`- Updated ${numberToUpdate.phoneNumber} to ${host}.`);
      }
    }
  }
}

pruneNumbers(program)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
