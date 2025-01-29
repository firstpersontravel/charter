const _ = require('lodash');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');

const models = require('../models');

/**
 * List all actors.
 */
const actorsListRoute = async (req, res) => {
  const org = await models.Org.findOne({
    where: { name: req.params.orgName }
  });
  if (!org) {
    res.status(404).send('Not found');
    return;
  }
  const players = await models.Player.findAll({
    where: { participantId: { [Sequelize.Op.not]: null } },
    include: [{
      model: models.Trip,
      as: 'trip',
      where: { isArchived: false },
      include: [{
        model: models.Script,
        as: 'script'
      }, {
        model: models.Experience,
        as: 'experience'
      }]
    }, {
      model: models.Participant,
      as: 'participant'
    }, {
      model: models.Org,
      as: 'org',
      where: { id: org.id }
    }]
  });
  // Just show all participants for now. How to filter for actors; figure out later.
  const trips = _(players)
    .map('trip')
    // TODO - remove this filter once we can put it in the DB query.
    .filter(trip => !trip.isArchived)
    .uniqBy('id')
    .sortBy('date')
    .map(trip => {
      const tripPlayers = players.filter(player => player.trip.id === trip.id);
      const tripParticipants = _(players)
        .filter(player => {
          const role = _.find(player.trip.script.content.roles, { name: player.roleName });
          if (!role) {
            return false;
          }
          const interface = _.find(player.trip.script.content.interfaces, { name: role.interface });
          return interface && interface.performer;
        })
        .map('participant')
        .uniqBy('id')
        .value();
      return {
        experienceTitle: tripPlayers[0].trip.experience.title,
        tripDate: moment.utc(trip.date).format('MMM DD'),
        tripParticipants: tripParticipants.map(participant => ({
          participantId: participant.id,
          name: participant.name,
          experienceTitle: tripPlayers[0].trip.experience.title,
          roleTitles: _(players)
            .filter(p => p.participant.id === participant.id)
            .map(p => _.get(p.trip.script.content.roles.find(r => r.name === p.roleName), 'title'))
            .uniq()
            .filter(Boolean)
            .value()
            .join(', ')
        }))
      };
    })
    .filter(trip => trip.tripParticipants.length > 0)
    .value();
  res.render('actor/actors', {
    layout: 'actor',
    orgName: org.name,
    orgTitle: org.title,
    trips: trips
  });
};

/**
 * Show a participant, including all active players.
 */
const participantShowRoute = async (req, res) => {
  const participant = await models.Participant.findOne({
    where: { id: req.params.participantId },
    include: [{
      model: models.Org,
      as: 'org',
      where: { name: req.params.orgName }
    }, {
      model: models.Experience,
      as: 'experience',
    }]
  });
  if (!participant) {
    res.redirect(`/actor/${req.params.orgName}`);
    return;
  }
  const players = await models.Player.findAll({
    where: { participantId: participant.id },
    include: [{
      model: models.Trip,
      as: 'trip',
      where: { isArchived: false }
    }]
  });
  if (!players.length) {
    res.redirect(`/actor/${req.params.orgName}`);
    return;
  }
  const currentTripId = req.query.trip ? Number(req.query.trip) : null;
  const currentTrip = currentTripId ?
    await models.Trip.findByPk(currentTripId) :
    null;
  
  const tripId = currentTripId || players[0].tripId;
  const playerId = currentTripId ?
    players.find(p => p.tripId === currentTripId).id :
    players[0].id;

  const params = {
    participantId: req.params.participantId,
    tripId: tripId,
    playerId: playerId,
    orgName: req.params.orgName,
    orgTitle: participant.org.title,
    experienceTitle: participant.experience.title,
    participantName: participant.name,
    currentRunSelector: currentTrip ? currentTrip.title : 'All runs',
    trips: players.map(player => ({
      tripId: player.tripId,
      tripTitle: player.trip.title
    })),
    iframeQuery: ''
  };
  res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
};

module.exports = {
  actorsListRoute,
  participantShowRoute
};
