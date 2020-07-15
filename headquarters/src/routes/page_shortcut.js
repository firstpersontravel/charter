const models = require('../models');

const playerShortcutRoute = async (req, res) => {
  const playerId = req.params.playerId;
  const player = await models.Player.findOne({
    where: { id: playerId },
    include: [{ model: models.Trip, as: 'trip' }]
  });
  if (!player) {
    res.status(404).send('Not Found');
    return;
  }
  res.cookie(`exp-${player.trip.experienceId}`, player.id);
  res.redirect(
    `/travel/u/${player.userId || 0}` +
    `/p/${player.tripId}` +
    `/p/${player.id}`
  );
};

module.exports = {
  playerShortcutRoute
};
