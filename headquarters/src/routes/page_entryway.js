const moment = require('moment-timezone');

const models = require('../models');

const SceneCore = require('fptcore/src/cores/scene');
const TextUtil = require('fptcore/src/utils/text');

const TripResetHandler = require('../handlers/trip_reset');
const ExperienceController = require('../controllers/experience');
const EntrywayController = require('../controllers/entryway');

const joinRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const trip = await models.Trip.findOne({
    where: {
      id: tripId,
      isArchived: false
    },
    include: [{
      model: models.Experience,
      as: 'experience',
      include: [{
        model: models.Org,
        as: 'org'
      }]
    }]
  });
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }

  const experience = trip.experience;
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
        `/travel/u/${player.participantId || 0}` +
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

const joinSubmitRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const roleName = req.params.roleName;

  const name = req.body.name;
  const email = req.body.email;
  const phoneNumber = req.body.phone.replace(/\D/g, '');

  if (!name || !email || phoneNumber.length !== 10) {
    res.status(400).send('Invalid form data, please try again.');
    return;
  }

  const trip = await models.Trip.findOne({
    where: {
      id: tripId,
      isArchived: false
    },
    include: [{
      model: models.Experience,
      as: 'experience',
      include: [{
        model: models.Org,
        as: 'org'
      }]
    }]
  });
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }

  const experience = trip.experience;

  const script = await ExperienceController.findActiveScript(experience.id);

  const playerRole = (script.content.roles || [])
    .filter(r => r.name === roleName)
    .sort(SceneCore.sortResource)[0];

  if (!playerRole) {
    res.status(404).send('Role not found');
    return;
  }

  const player = await models.Player.findOne({
    where: { tripId: trip.id, roleName: playerRole.name }
  });
  // Look for a participant by phone number, or create if doesn't exist.
  const [entrywayParticipant, ] = await models.Participant.findOrCreate({
    where: {
      orgId: script.orgId,
      experienceId: script.experienceId,
      isActive: true,
      phoneNumber: phoneNumber
    },
    defaults: {
      createdAt: moment.utc(),
      name: name,
      email: email
    }
  });
  // Add firstName and email to participant
  await models.Participant.update(
    { name: name, email: email},
    { where: { id: entrywayParticipant.id } });
  // Associate this player with the registered participant
  await models.Player.update(
    { participantId: entrywayParticipant.id },
    { where: { id: player.id } });
  res.cookie(`exp-${experience.id}`, player.id);
  res.redirect(
    `/travel/u/${player.participantId || 0}` +
    `/p/${player.tripId}` +
    `/role/${player.roleName}`);
};


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
        `/travel/u/${player.participantId || 0}` +
        `/p/${player.tripId}` +
        `/role/${player.roleName}`);
      return;
    }
  }

  const script = await ExperienceController.findActiveScript(experience.id);
  res.render('entryway/entryway', {
    layout: 'entryway',
    experienceTitle: experience.title,
    script: script,
    roleName: req.params.roleName,
    tripId: req.params.tripId
  });
};

const entrywaySubmitRoute = async (req, res) => {
  const orgName = req.params.orgName;
  const experienceName = req.params.experienceName;
  const interfaceTitleStub = req.params.interfaceTitleStub || null;
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
  const interface = (script.content.interfaces || [])
    .filter(i => (
      interfaceTitleStub === null ||
      interfaceTitleStub === TextUtil.dashVarForText(i.title)
    ))
    .sort(SceneCore.sortResource)[0];
  
  if (!interface) {
    res.status(404).send('Entryway interface not found');
    return;
  }

  const playerRole = (script.content.roles || [])
    .filter(r => r.interface === interface.name)
    .sort(SceneCore.sortResource)[0];

  if (!playerRole) {
    res.status(404).send('Role for entryway interface not found');
    return;
  }

  const trip = await EntrywayController.createTrip(script, playerRole.name, 
    phoneNumber);

  // Reset it to the start to initiate starting actions like start scene.
  await TripResetHandler.resetToStart(trip.id);

  const player = await models.Player.findOne({
    where: { tripId: trip.id, roleName: playerRole.name }
  });
  await models.Participant.update(
    { name: name, email: email },
    { where: { id: player.participantId } });

  res.cookie(`exp-${experience.id}`, player.id);
  res.redirect(
    `/travel/u/${player.participantId || 0}` +
    `/p/${player.tripId}` +
    `/role/${player.roleName}`);
};

module.exports = {
  entrywayRoute,
  entrywaySubmitRoute,
  joinRoute,
  joinSubmitRoute
};
