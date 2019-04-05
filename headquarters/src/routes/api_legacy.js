const _ = require('lodash');

const models = require('../models');

function camelToDash(str) {
  return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
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

/**
 * Legacy getter for THG app in JSONAPI format.
 */
async function getUserRoute(req, res) {
  const user = await models.User.findByPk(req.params.id);
  const response = { data: jsonApiSerialize(user) };
  res.status(200);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(response, null, 2));
}

/**
 * Legacy getter for THG app in JSONAPI format.
 */
async function getTripRoute(req, res) {
  const includeScript = !!req.query.script;
  const trip = await models.Trip.findOne({
    where: { id: req.params.id },
    include: [
      { model: models.Script, as: 'script' },
      { model: models.Experience, as: 'experience' }
    ]
  });
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }
  const [assets, players, messages, actions, profiles, users] = (
    await Promise.all([
      models.Asset.findAll({ where: { experienceId: trip.experienceId } }),
      models.Player.findAll({ where: { tripId: req.params.id } }),
      models.Message.findAll({
        where: { tripId: req.params.id, isArchived: false }
      }),
      models.Action.findAll({
        where: {
          tripId: req.params.id,
          type: 'action',
          isArchived: false,
          appliedAt: null,
          failedAt: null
        }
      }),
      models.Profile.findAll({
        where: {
          isArchived: false,
          experienceId: trip.experienceId
        }
      }),
      models.User.findAll({ where: { isArchived: false } })
    ])
  );

  // Hack for now -- sub in the directions assets data into the script before
  // sending over.
  trip.script.content.directions = _(assets)
    .filter({ type: 'directions' })
    .map('data')
    .value();

  const objs = players
    .concat(messages)
    .concat(actions)
    .concat(profiles)
    .concat(users);

  if (includeScript) {
    objs.push(trip.script);
    objs.push(trip.experience);
  }

  const data = jsonApiSerialize(trip);
  data.relationships.action = actions
    .map(action => ({ id: action.id, type: 'action' }));
  data.relationships.message = messages
    .map(message => ({ id: message.id, type: 'message' }));
  data.relationships.player = players
    .map(player => ({ id: player.id, type: 'player' }));

  const includedData = objs.map(jsonApiSerialize);
  const response = { data: data, included: includedData };
  res.status(200);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(response, null, 2));
}

module.exports = {
  getUserRoute,
  getTripRoute
};
