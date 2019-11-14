const _ = require('lodash');

const models = require('../models');
const KernelController = require('../kernel/kernel');

const redirectRoute = async (req, res) => {
  const tripId = req.query.tripId;
  const cueName = req.query.cueName;
  const pageName = req.query.pageName;

  const trip = await models.Trip.findByPk(tripId);
  const script = await trip.getScript();

  if (cueName) {
    const cue = _.find(script.content.cues, { name: cueName });
    const tripFilters = { isArchived: false };
    if (cue.scope === 'experience') {
      tripFilters.experienceId = trip.experienceId;
    } else if (cue.scope === 'group') {
      tripFilters.groupId = trip.groupId;
    } else {
      tripFilters.id = trip.id;
    }
    const trips = await models.Trip.find({ where: tripFilters });
    const event = { type: 'cue_signaled', cue: cueName };
    for (const cueTrip of trips) {
      await KernelController.applyEvent(cueTrip.id, event);
    }
  }

  if (pageName) {
    const page = _.find(script.content.pages, { name: pageName });
    const role = _.find(script.content.roles, { name: page.roleName });
    const player = await models.Player.find({
      where: {
        tripId: trip.id,
        roleName: role.name
      }
    });
    if (!player) {
      res.status(404).send('Not Found');
      return;
    }
    res.redirect(
      `/travel/u/${player.userId || 0}` +
      `/p/${player.tripId}` +
      `/role/${player.roleName}`
    );
    return;
  }

  res.send('ok');
  return;
};

module.exports = {
  redirectRoute
};
