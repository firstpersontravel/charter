const _ = require('lodash');

const models = require('../models');
const ExperienceController = require('../controllers/experience');
const KernelController = require('../kernel/kernel');

const redirectRoute = async (req, res) => {
  const experienceId = req.query.e;
  const roleName = req.query.r;
  const cueName = req.query.c;
  const pageName = req.query.p;

  const experience = await models.Experience.findByPk(experienceId);
  const script = await ExperienceController.findActiveScript(experience.id);

  if (!experience) {
    res.status(400).send('Invalid QR code.');
    return;
  }

  const loggedInPlayerId = req.cookies[`exp-${experienceId}`];
  console.log('loggedInPlayerId', loggedInPlayerId);
  if (!loggedInPlayerId) {
    res.status(401).send('You must be logged in already to scan this code.  Make sure you scanned the code in the same browser that you signed in with.');
    return;
  }

  const loggedInPlayer = await models.Player.findByPk(loggedInPlayerId);
  console.log('loggedInPlayer', loggedInPlayer.roleName, roleName);
  if (!loggedInPlayer || loggedInPlayer.roleName !== roleName) {
    res.status(401).send('You must be logged into the correct role to scan this code. Make sure you scanned the code in the same browser that you signed in with.');
    return;
  }

  const loggedInTrip = await loggedInPlayer.getTrip();

  if (pageName) {
    await loggedInPlayer.update({ currentPageName: pageName });
  }

  if (cueName) {
    const cue = _.find(script.content.cues, { name: cueName });
    const tripFilters = { isArchived: false };
    if (cue.scope === 'experience') {
      tripFilters.experienceId = experienceId;
    } else if (cue.scope === 'group') {
      tripFilters.groupId = loggedInTrip.groupId;
    } else {
      tripFilters.id = loggedInTrip.id;
    }
    const trips = await models.Trip.findAll({ where: tripFilters });
    const event = { type: 'cue_signaled', cue: cueName };
    for (const cueTrip of trips) {
      await KernelController.applyEvent(cueTrip.id, event);
    }
  }

  res.redirect(
    `/travel/u/${loggedInPlayer.userId || 0}` +
    `/p/${loggedInPlayer.tripId}` +
    `/role/${loggedInPlayer.roleName}`);
};

module.exports = {
  redirectRoute
};
