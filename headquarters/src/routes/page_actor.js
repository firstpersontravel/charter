const _ = require('lodash');
const Promise = require('bluebird');
const Sequelize = require('sequelize');

const ConditionCore = require('../../../fptcore/src/cores/condition');
const EvalCore = require('../../../fptcore/src/cores/eval');
const PlayerCore = require('../../../fptcore/src/cores/player');

const config = require('../config');
const models = require('../models');
const TripUtil = require('../controllers/trip_util');

const supportedPartials = {
  button: (evalContext, panel, timezone) => ({
    text: EvalCore.templateText(evalContext, panel.text, timezone)
  }),
  text: (evalContext, panel, timezone) => ({
    paragraphs: EvalCore
      .templateText(evalContext, panel.text, timezone)
      .split('\n')
      .filter(Boolean)
  }),
  choice: (evalContext, panel, timezone) => ({
    text: EvalCore.templateText(evalContext, panel.text, timezone),
    choices: _.map(panel.choices, choice => (
      Object.assign({}, choice, {
        isChosen: EvalCore.lookupRef(evalContext, panel.value_ref) ===
          choice.value
      })
    ))
  }),
  yesno: (evalContext, panel, timezone) => ({
    text: EvalCore.templateText(evalContext, panel.text, timezone),
    isYes: EvalCore.lookupRef(evalContext, panel.value_ref) === true,
    isNo: EvalCore.lookupRef(evalContext, panel.value_ref) === false
  }),
  default: () => ({})
};

function getPanel(trip, evalContext, timezone, pageInfo, panel) {
  const panelType = supportedPartials[panel.type] ? panel.type : 'default';
  const customParams = supportedPartials[panelType](evalContext, panel,
    timezone);
  return Object.assign(customParams, {
    type: 'panels/' + panelType,
    pageInfo: pageInfo,
    panel: panel,
    trip: trip,
    isPageActive: pageInfo.page.scene === trip.currentSceneName
  });
}

/**
 * Construct an object of the page
 */
function getPage(objs, evalContext, player) {
  const script = objs.script;
  const trip = objs.trip;
  const timezone = objs.experience.timezone;
  const pageInfo = PlayerCore.getPageInfo(script, evalContext, player);
  if (!pageInfo) {
    return null;
  }
  const appearanceSort = PlayerCore.getSceneSort(script, evalContext, player);
  const appearance = pageInfo.appearance;
  const page = pageInfo.page;
  const directiveText = EvalCore.templateText(evalContext,
    page.directive, timezone);
  const panels = _(page.panels || [])
    .filter(panel => ConditionCore.if(evalContext, panel.active_if))
    .map(panel => getPanel(trip, evalContext, timezone, pageInfo, panel))
    .value();
  return {
    experienceTitle: objs.experience.title,
    trip: trip,
    player: player,
    role: _.find(script.content.roles, { name: player.roleName }),
    page: page,
    panels: panels,
    pageInfo: pageInfo,
    appearance: appearance,
    sort: appearanceSort,
    directiveText: directiveText
  };
}

/**
 * List all actors.
 */
const actorsListRoute = async (req, res) => {
  const players = await models.Player.findAll({
    where: { userId: { [Sequelize.Op.not]: null } },
    include: [{
      model: models.Trip,
      as: 'trip',
      where: { isArchived: false },
      include: [{
        model: models.Script,
        as: 'script'
      }]
    }, {
      model: models.User,
      as: 'user'
    }]
  });
  const actorPlayers = players.filter(((player) => {
    const roles = player.trip.script.content.roles;
    const role = _.find(roles, { name: player.roleName });
    return role && role.type === 'performer';
  }));
  const users = _.uniqBy(_.map(actorPlayers, 'user'), 'id');
  res.render('actor/actors', {
    layout: 'actor',
    users: users
  });
};

/**
 * Show a single player (even if they have no user).
 */
const playerShowRoute = async (req, res) => {
  const playerId = req.params.playerId;
  const player = await models.Player.findByPk(playerId);
  if (!player) {
    res.redirect('/actor');
    return;
  }
  const objs = await TripUtil.getObjectsForTrip(player.tripId);
  const evalContext = TripUtil.prepareEvalContext(objs);
  const page = getPage(objs, evalContext, player);
  const pages = page ? [Object.assign(page, { isFirst: true })] : [];
  const params = {
    userId: '',
    userName: player.roleName,
    pages: pages,
    stage: config.env.STAGE,
    tripIds: player.tripId
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
};

/**
 * Show a user, including all active players.
 */
const userShowRoute = async (req, res) => {
  const user = await models.User.findByPk(req.params.userId);
  if (!user) {
    res.redirect('/actor');
    return;
  }
  const players = await models.Player.findAll({
    where: { userId: user.id },
    include: [{
      model: models.Trip,
      as: 'trip',
      where: { isArchived: false }
    }]
  });
  const playersByDeparture = _(players)
    .sortBy(player => player.trip.departureName)
    .value();

  const objsList = await Promise.map(playersByDeparture, (player) => (
    TripUtil.getObjectsForTrip(player.tripId)
  ));

  const pages = _(players)
    .map((player, i) => {
      const objs = objsList[i];
      const evalContext = TripUtil.prepareEvalContext(objs);
      return getPage(objs, evalContext, player);
    })
    .filter(Boolean)
    .sortBy('sort')
    .map((page, i) => Object.assign(page, { isFirst: i === 0 }))
    .value();

  const params = {
    userId: req.params.userId,
    userName: `${user.firstName} ${user.lastName}`,
    pages: pages,
    stage: config.env.STAGE,
    tripIds: _.map(players, 'tripId').join(',')
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
};

module.exports = {
  actorsListRoute,
  playerShowRoute,
  userShowRoute
};
