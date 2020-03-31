const _ = require('lodash');
const models = require('../models');

const ExperienceController = require('../controllers/experience');
const EntrywayController = require('../controllers/entryway');

const entrywayRoute = async (req, res) => {
  const orgName = req.params.orgName;
  const experienceName = req.params.experienceName;
  const experience = await models.Experience.findOne({
    where: {
      name: experienceName,
      isArchived: false
    },
    include: [{
      model: models.Org,
      as: 'org',
      where: { name: orgName }
    }]
  });
  if (!experience) {
    res.status(404).send('Not Found');
    return;
  }

  if (req.cookies[`exp-${experience.id}`]) {
    const playerId = req.cookies[`exp-${experience.id}`];
    const player = await models.Player.findOne({
      where: { id: playerId },
      include: [{
        model: models.Trip,
        as: 'trip',
        where: { isArchived: false }
      }]
    });
    if (player) {
      res.redirect(
        `/travel/u/${player.userId || 0}` +
        `/p/${player.tripId}` +
        `/role/${player.roleName}`);
      return;
    }
  }

  const script = await ExperienceController.findActiveScript(experience.id);
  res.render('entryway/entryway', {
    layout: 'entryway',
    experienceTitle: experience.title,
    script: script
  });
};

const entrywaySubmitRoute = async (req, res) => {
  const orgName = req.params.orgName;
  const experienceName = req.params.experienceName;
  const name = req.body.name;
  const email = req.body.email;
  const phoneNumber = req.body.phone.replace(/\D/g, '');

  if (!name || !email || phoneNumber.length !== 10) {
    res.status(400).send('Invalid form data, please try again.');
    return;
  }

  const experience = await models.Experience.findOne({
    where: {
      name: experienceName,
      isArchived: false
    },
    include: [{
      model: models.Org,
      as: 'org',
      where: { name: orgName }
    }]
  });

  const script = await ExperienceController.findActiveScript(experience.id);
  const playerRole = _.find(script.content.roles, { type: 'traveler' });
  if (!playerRole) {
    res.status(500).send('No player role found.');
    return;
  }

  const trip = await EntrywayController.createTrip(script, playerRole.name, 
    phoneNumber);
  const player = await models.Player.findOne({
    where: { tripId: trip.id, roleName: playerRole.name }
  });
  await models.User.update({
    firstName: name,
    email: email
  }, {
    where: { id: player.userId }
  });

  res.cookie(`exp-${experience.id}`, player.id);
  res.redirect(
    `/travel/u/${player.userId || 0}` +
    `/p/${player.tripId}` +
    `/role/${player.roleName}`);
};

module.exports = {
  entrywayRoute,
  entrywaySubmitRoute
};
