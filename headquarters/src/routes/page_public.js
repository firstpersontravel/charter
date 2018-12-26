const models = require('../models');

const homeRoute = async (req, res) => {
  res.render('public/main', { layout: 'public' });
};

const participantShortcutRoute = async (req, res) => {
  const participantId = req.params.participantId;
  const participant = await models.Participant.findById(participantId);
  if (!participant) {
    res.status(404).send('Not Found');
    return;
  }
  res.redirect(
    `/travel/u/${participant.userId || 0}` +
    `/p/${participant.tripId}` +
    `/role/${participant.roleName}`
  );
};

module.exports = {
  homeRoute,
  participantShortcutRoute
};
