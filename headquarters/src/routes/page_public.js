const models = require('../models');

const homeRoute = async (req, res) => {
  res.render('public/main', { layout: 'public' });
};

const playerShortcutRoute = async (req, res) => {
  const playerId = req.params.playerId;
  const player = await models.Player.findById(playerId);
  if (!player) {
    res.status(404).send('Not Found');
    return;
  }
  res.redirect(
    `/travel/u/${player.userId || 0}` +
    `/p/${player.tripId}` +
    `/role/${player.roleName}`
  );
};

module.exports = {
  homeRoute,
  playerShortcutRoute
};
