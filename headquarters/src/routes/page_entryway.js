const moment = require('moment-timezone');
const Sequelize = require('sequelize');

const models = require('../models');

const TextUtil = require('fptcore/src/utils/text');

const TripResetHandler = require('../handlers/trip_reset');
const ExperienceController = require('../controllers/experience');
const EntrywayController = require('../controllers/entryway');

async function getLoggedInPlayer(req, experienceId, roleName) {
  const cookieName = `exp-${experienceId}`;
  if (!req.cookies[cookieName]) {
    return null;
  }
  const playerId = req.cookies[cookieName];
  const player = await models.Player.findOne({
    where: { id: playerId },
    include: [{ model: models.Trip, as: 'trip', where: { isArchived: false } }]
  });

  // Redirect if we have logged in as a player already with a matching role
  if (player && player.roleName === roleName) {
    return player;
  }
  return null;
}

// https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
function lumaForColor(col) {
  var c = col.slice(1);      // strip #
  var rgb = parseInt(c, 16);   // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff;  // extract red
  var g = (rgb >>  8) & 0xff;  // extract green
  var b = (rgb >>  0) & 0xff;  // extract blue
  
  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma;  
}

function chooseTextColor(bgCol) {
  const bgLuma = lumaForColor(bgCol);
  return bgLuma < 150 ? '#ffffff' : '#000000';
}

function renderStyle(script, interfaceName) {
  if (!interfaceName) {
    return '';
  }
  const iface = (script.content.interfaces || []).find(i => i.name === interfaceName);
  if (!iface) {
    return '';
  }
  const fontFamily = iface.font_family || 'Raleway';
  const bgColor = iface.background_color || '#ffffff';
  const headerColor = iface.header_color || '#aaaaaa';
  const primaryColor = iface.primary_color || '#aa0000';
  return `
body {
  font-family: ${fontFamily};
  background-color: ${bgColor};
  color: ${chooseTextColor(bgColor)};
}
h1, .navbar-brand {
  font-family: ${fontFamily};
}
nav {
  background-color: ${headerColor};
  color: ${chooseTextColor(headerColor)};
}
.btn.btn-primary {
  background-color: ${primaryColor};
  border-color: ${primaryColor};
  color: ${chooseTextColor(primaryColor)};
}
`;
}

function shouldAskForPhone(script, roleName) {
  return !!(script.content.relays || []).find(r => r.for === roleName);
}

function shouldAskForEmail(script, roleName) {
  return !!(script.content.inboxes || []).find(i => i.role === roleName);
}

const entrywayRoute = async (req, res) => {
  const orgName = req.params.orgName;
  const experienceName = req.params.experienceName;
  const roleTitleStub = req.params.roleTitleStub;
  const experience = await models.Experience.findOne({
    where: { name: experienceName, isArchived: false },
    include: [{ model: models.Org, as: 'org', where: { name: orgName } }]
  });
  if (!experience) {
    res.status(404).send('Not Found');
    return;
  }

  const script = await ExperienceController.findActiveScript(experience.id);
  const playerRole = (script.content.roles || [])
    .find(r => roleTitleStub === TextUtil.dashVarForText(r.title));
  if (!playerRole) {
    res.status(404).send(`Role ${roleTitleStub} not found`);
    return;
  }

  const loggedInPlayer = await getLoggedInPlayer(req, experience.id, playerRole.name);
  if (loggedInPlayer) {
    res.redirect(`/travel2/${loggedInPlayer.tripId}/${loggedInPlayer.id}`);
    return;
  }

  res.render('entryway/entryway', {
    layout: 'entryway',
    experienceTitle: experience.title,
    actionTitle: `Start as ${playerRole.title}`,
    askForPhone: shouldAskForPhone(script, playerRole.name),
    askForEmail: shouldAskForEmail(script, playerRole.name),
    style: renderStyle(script, playerRole.interface)
  });
};

const entrywaySubmitRoute = async (req, res) => {
  const orgName = req.params.orgName;
  const experienceName = req.params.experienceName;
  const roleTitleStub = req.params.roleTitleStub;
  const name = req.body.name || '';
  const email = req.body.email || '';
  const phoneNumber = (req.body.phone || '').replace(/\D/g, '');

  const experience = await models.Experience.findOne({
    where: { name: experienceName, isArchived: false },
    include: [{ model: models.Org, as: 'org', where: { name: orgName } }]
  });

  const script = await ExperienceController.findActiveScript(experience.id);
  const playerRole = (script.content.roles || [])
    .find(r => roleTitleStub === TextUtil.dashVarForText(r.title));

  if (!playerRole) {
    res.status(404).send(`Role ${roleTitleStub} not found`);
    return;
  }

  const trip = await EntrywayController.createTripFromEntryway(script, playerRole.name, 
    phoneNumber ? `+1${phoneNumber}` : '', name);

  // Reset it to the start to initiate starting actions like start scene.
  await TripResetHandler.resetToStart(trip.id);

  const player = await models.Player.findOne({
    where: { tripId: trip.id, roleName: playerRole.name }
  });
  await models.Participant.update(
    { name: name, email: email },
    { where: { id: player.participantId } });

  res.cookie(`exp-${experience.id}`, player.id);
  res.redirect(`/travel2/${player.tripId}/${player.id}`);
};


const joinRoute = async (req, res) => {
  const roleName = req.params.roleName;
  const tripId = req.params.tripId;
  const trip = await models.Trip.findOne({
    where: { id: tripId, isArchived: false },
    include: [{ model: models.Experience, as: 'experience' }]
  });
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }

  const script = await ExperienceController.findActiveScript(trip.experienceId);
  const playerRole = (script.content.roles || []).find(r => r.name === roleName);
  if (!playerRole) {
    res.status(404).send('Role for entryway interface not found');
    return;
  }

  // Return logged in player
  const loggedInPlayer = await getLoggedInPlayer(req, trip.experienceId, roleName);
  if (loggedInPlayer) {
    res.redirect(`/travel2/${loggedInPlayer.tripId}/${loggedInPlayer.id}`);
    return;
  }

  // If we're full, go to player that last joined
  const existingPlayers = await models.Player.findAll({
    where: { tripId: trip.id, roleName: roleName, participantId: { [Sequelize.Op.ne]: null } }
  });
  if (existingPlayers.length > 0) {
    const lastPlayer = existingPlayers[existingPlayers.length - 1];
    res.redirect(`/travel2/${lastPlayer.tripId}/${lastPlayer.id}`);
    return;
  }

  // Show signup if no existing player
  res.render('entryway/entryway', {
    layout: 'entryway',
    experienceTitle: trip.experience.title,
    actionTitle: `Join as ${playerRole.title}`,
    askForPhone: shouldAskForPhone(script, playerRole.name),
    askForEmail: shouldAskForEmail(script, playerRole.name),
    style: renderStyle(script, playerRole.interface)
  });
};

const joinSubmitRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const roleName = req.params.roleName;
  const name = req.body.name || '';
  const email = req.body.email || '';
  const phoneNumber = (req.body.phone || '').replace(/\D/g, '');

  const trip = await models.Trip.findByPk(tripId);
  if (!trip) {
    res.status(404).send('Not Found');
    return;
  }

  // Look for a participant by phone number, or create if doesn't exist.
  const participantFilter = {
    orgId: trip.orgId,
    experienceId: trip.experienceId,
    isActive: true,
  };
  if (phoneNumber) {
    participantFilter.phoneNumber =  `+1${phoneNumber}`;
  } else if (email) {
    participantFilter.email = email;
  } else {
    // If neither phone number nor email are provided, always create a new participant
    // since we can't de-duplicate by any field.
    participantFilter.email = 'IMPOSSIBLE';
  }
  const [participant, ] = await models.Participant.findOrCreate({
    where: participantFilter,
    defaults: {
      createdAt: moment.utc(),
      name: name,
      email: email,
      phoneNumber: phoneNumber ? `+1${phoneNumber}` : ''
    }
  });

  // Update participant if deduplicated
  if (participant.name !== name || (email && participant.email !== email)) {
    await models.Participant.update(
      { name: name, email: email },
      { where: { id: participant.id } });
  }

  // Find an unassigned player, or make a new one if it doesn't exist.
  const [player, ] = await models.Player.findOrCreate({
    where: { tripId: trip.id, roleName: roleName, participantId: null },
    defaults: { orgId: trip.orgId, experienceId: trip.experienceId }
  });

  // Associate this player with the registered participant
  await models.Player.update(
    { participantId: participant.id },
    { where: { id: player.id } });

  // Ensure this participant has a profile
  const [profile, ] = await models.Profile.findOrCreate({
    where: {
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      participantId: participant.id,
      roleName: roleName,
      isArchived: false
    }
  });

  // Update profile if re-enabling
  if (!profile.isActive) {
    await models.Profile.update({ isActive: true }, { where: { id: profile.id } });
  }
    
  res.cookie(`exp-${trip.experienceId}`, player.id);
  res.redirect(`/travel2/${player.tripId}/${player.id}`);
};

module.exports = {
  entrywayRoute,
  entrywaySubmitRoute,
  joinRoute,
  joinSubmitRoute
};
