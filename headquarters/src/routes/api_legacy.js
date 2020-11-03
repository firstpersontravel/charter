const _ = require('lodash');
const crypto = require('crypto');
const twilio = require('twilio');

const coreWalker = require('fptcore/src/core-walker');

const config = require('../config');
const models = require('../models');
const { instrument } = require('../sentry');
const { createTripToken } = require('./auth');
const { Sequelize } = require('sequelize');
const { respondWithJson } = require('./utils');

function camelToDash(str) {
  return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

function createVideoToken(identity) {
  if (!config.env.HQ_TWILIO_SID || !config.env.HQ_TWILIO_VIDEO_SID) {
    return null;
  }
  const accessToken = new twilio.jwt.AccessToken(
    config.env.HQ_TWILIO_SID,
    config.env.HQ_TWILIO_VIDEO_SID,
    config.env.HQ_TWILIO_VIDEO_KEY
  );
  accessToken.identity = identity;
  const grant = new twilio.jwt.AccessToken.VideoGrant();
  accessToken.addGrant(grant);
  return accessToken.toJwt();
}

function jsonApiSerialize(instance) {
  const model = models[instance._modelOptions.name.singular];
  const relationships = _(model.associations)
    .toPairs()
    .filter((keyAndFk) => instance.dataValues[`${keyAndFk[0]}Id`])
    .map(([key, fk]) => (
      [camelToDash(key), {
        data: {
          id: instance.dataValues[`${key}Id`],
          type: fk.target.name.toLowerCase()
        }
      }]
    ))
    .fromPairs()
    .value();
  return {
    attributes: _(instance.toJSON())
      .mapKeys((v, k) => camelToDash(k))
      .toPairs()
      .sortBy(0)
      .filter((kv) => kv[0] !== 'id' && kv[0].indexOf('-id') === -1)
      .fromPairs()
      .value(),
    id: instance.id,
    relationships: relationships,
    type: model.name.toLowerCase()
  };
}

// Only include collections needed for the interface.
const includedCollections = [
  'geofences',
  'interfaces',
  'pages',
  'waypoints',
  'roles',
  'routes',
  'scenes',
  'content_pages',
  'variants',
  'triggers' // needed for 'arrival' triggers in directions
];

function filterCollection(collectionName, items) {
  // Filter triggers to only return the event -- the frontend only needs to know about the
  // presence or absence of triggers, not their behavior.
  if (collectionName === 'triggers') {
    return (items || []).map(item => ({
      name: item.name,
      event: item.event
    }));
  }
  // Return all for everything else
  return items;
}

function filterScriptContent(scriptContent) {
  return Object.fromEntries(Object
    .keys(scriptContent)
    .filter(key => includedCollections.includes(key))
    .map(key => [key, filterCollection(key, scriptContent[key])]));
}

/**
 * Legacy getter for THG app in JSONAPI format.
 */
async function getPlayerRoute(req, res) {
  const player = await models.Player.findOne({
    where: { id: req.params.id },
    include: [
      { model: models.Org, as: 'org' },
      { model: models.Experience, as: 'experience' },
      { model: models.Trip, as: 'trip' }
    ]
  });
  if (!player) {
    res.status(404).json({ error: 'notfound' });
    return;
  }
  const response = {
    data: jsonApiSerialize(player),
    included: [
      jsonApiSerialize(player.org),
      jsonApiSerialize(player.experience)
    ]
  };
  res.loggingOrgId = player.orgId;
  res.status(200);
  respondWithJson(res, response);
}

/**
 * Legacy getter for THG app in JSONAPI format. There is no security here.
 */
async function getTripRoute(req, res) {
  const playerId = req.query.playerId;
  const includeScript = !!req.query.script;
  const trip = await models.Trip.findOne({
    where: { id: req.params.id },
    include: [
      { model: models.Group, as: 'group' },
      { model: models.Script, as: 'script' },
      { model: models.Experience, as: 'experience' },
      { model: models.Org, as: 'org' }
    ]
  });
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }

  const [assets, players, messages] = await Promise.all([
    models.Asset.findAll({
      where: { experienceId: trip.experienceId, type: 'directions' }
    }),
    models.Player.findAll({ where: { tripId: req.params.id } }),
    models.Message.findAll({
      where: { tripId: req.params.id, isArchived: false }
    })
  ]);

  const participantIds = players.map(p => p.participantId).filter(Boolean);
  const [profiles, participants] = await Promise.all([
    models.Profile.findAll({
      where: { participantId: { [Sequelize.Op.in]: participantIds } }
    }),
    models.Participant.findAll({
      where: { id: { [Sequelize.Op.in]: participantIds } }
    })
  ]);
  
  const objs = players
    .concat(messages)
    .concat(profiles)
    .concat(participants);

  // Find all audio media to preload
  const preloadUrls = [];
  coreWalker.walkAllFields(trip.script.content, 'media', (_, __, obj, paramSpec) => {
    if (paramSpec.medium === 'audio' && obj) {
      preloadUrls.push(obj);
    }
  });

  if (includeScript) {
    // Include only collections needed
    trip.script.content = filterScriptContent(trip.script.content);
    // Sub in the directions assets data into the script as a resource
    trip.script.content.directions = assets.map(a => a.data);
    objs.push(trip.group);
    objs.push(trip.script);
    objs.push(trip.experience);
    objs.push(trip.org);
  }

  const data = jsonApiSerialize(trip);
  data.relationships.message = messages
    .map(message => ({ id: message.id, type: 'message' }));
  data.relationships.player = players
    .map(player => ({ id: player.id, type: 'player' }));
  
  // Add URLs to preload
  data.attributes['preload-urls'] = preloadUrls;

  // Sneak in a day long auth token
  data.attributes['auth-token'] = createTripToken(trip, 86400);

  // Create a video token by IP in case multiple users or devices share a role.
  const userAgentHash = crypto.createHash('md5').update(req.get('User-Agent')).digest('hex');
  const identity = `${playerId}-${userAgentHash}-${req.ip}`;
  data.attributes['video-token'] = instrument('twilio', 'createVideoToken', 
    () => createVideoToken(identity));

  const includedData = objs.map(jsonApiSerialize);
  const response = { data: data, included: includedData };
  res.loggingOrgId = trip.orgId;
  res.status(200);
  respondWithJson(res, response);
}

module.exports = {
  getTripRoute,
  getPlayerRoute
};
