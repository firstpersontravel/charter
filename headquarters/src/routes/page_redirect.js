const models = require('../models');
const KernelController = require('../kernel/kernel');

const redirectRoute = async (req, res) => {
  const experienceId = req.query.e;
  const roleName = req.query.r;
  const cueName = req.query.c;
  const pageName = req.query.p;

  const experience = await models.Experience.findByPk(experienceId);

  if (!experience) {
    res.status(400).send('Invalid QR code.');
    return;
  }

  const loggedInPlayerId = req.cookies[`exp-${experienceId}`];
  if (!loggedInPlayerId) {
    res.status(401).send('Player not logged in.');
    return;
  }

  const loggedInPlayer = await models.Player.findByPk(loggedInPlayerId);
  console.log('loggedInPlayer', loggedInPlayer.roleName, roleName);
  if (!loggedInPlayer || loggedInPlayer.roleName !== roleName) {
    res.status(401).send('Player not logged in.');
    return;
  }

  const loggedInTrip = await loggedInPlayer.getTrip();

  if (pageName) {
    const newTripState = Object.assign({}, loggedInTrip.tripState, {
      currentPageNamesByRole: Object.assign({},
        loggedInTrip.tripState.currentPageNamesByRole,
        { [roleName]: pageName })
    });
    await loggedInTrip.update({ tripState: newTripState });
  }

  if (cueName) {
    const event = { type: 'cue_signaled', cue: cueName };
    await KernelController.applyEvent(loggedInTrip.id, event);
  }

  res.redirect(
    `/travel/u/${loggedInPlayer.userId || 0}` +
    `/p/${loggedInPlayer.tripId}` +
    `/role/${loggedInPlayer.roleName}`);
};

module.exports = {
  redirectRoute
};
