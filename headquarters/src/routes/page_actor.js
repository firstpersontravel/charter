const _ = require('lodash');
const Promise = require('bluebird');
const Sequelize = require('sequelize');

const fptCore = require('fptcore');

const config = require('../config');
const models = require('../models');
const TripUtil = require('../controllers/trip_util');

const supportedPartials = {
  button: (script, context, panel) => ({
    text: fptCore.EvalCore.templateText(context, panel.text, script.timezone)
  }),
  text: (script, context, panel) => ({
    paragraphs: fptCore.EvalCore
      .templateText(context, panel.text, script.timezone)
      .split('\n')
      .filter(Boolean)
  }),
  choice: (script, context, panel) => ({
    text: fptCore.EvalCore.templateText(context, panel.text, script.timezone),
    choices: _.map(panel.choices, choice => (
      Object.assign({}, choice, {
        isChosen: fptCore.EvalCore.lookupRef(context, panel.value_ref) ===
          choice.value
      })
    ))
  }),
  yesno: (script, context, panel) => ({
    text: fptCore.EvalCore.templateText(context, panel.text, script.timezone),
    isYes: fptCore.EvalCore.lookupRef(context, panel.value_ref) === true,
    isNo: fptCore.EvalCore.lookupRef(context, panel.value_ref) === false
  }),
  default: () => ({})
};

function getPanel(script, trip, context, pageInfo, panel) {
  const panelType = supportedPartials[panel.type] ? panel.type : 'default';
  const customParams = supportedPartials[panelType](script, context, panel);
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
function getPage(script, trip, context, player) {
  const pageInfo = fptCore.PlayerCore.getPageInfo(script, context,
    player);
  if (!pageInfo) {
    return null;
  }
  const appearanceSort = fptCore.PlayerCore.getSceneSort(script, context,
    player);
  const localSceneStart = pageInfo.appearanceStart ?
    pageInfo.appearanceStart.clone().tz(script.timezone) :
    null;
  const appearanceDisabledStart = localSceneStart ?
    ('- Starts ' + localSceneStart.format('h:mma')) : '';
  const appearance = pageInfo.appearance;
  const introText = fptCore.EvalCore.templateText(context, appearance.intro,
    script.timezone);
  const page = pageInfo.page;
  const directiveText = fptCore.EvalCore.templateText(context,
    page.directive, script.timezone);
  const panels = _(page.panels || [])
    .filter(panel => !panel.if || fptCore.EvalCore.if(context, panel.if))
    .map(panel => getPanel(script, trip, context, pageInfo, panel))
    .value();
  return {
    scriptTitle: script.title,
    trip: trip,
    player: player,
    page: page,
    panels: panels,
    pageInfo: pageInfo,
    appearance: appearance,
    appearanceDisabledStart: appearanceDisabledStart,
    appearanceDisabledIntro: introText,
    appearanceDisabledMessage: appearance.disabled_message ||
      'Not ready to start',
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
    return role && role.actor;
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
  const player = await models.Player.findById(playerId);
  if (!player) {
    res.redirect('/actor');
    return;
  }
  const objs = await (
    TripUtil.getObjectsForTrip(player.tripId)
  );
  const context = TripUtil.createEvalContext(objs);
  const page = getPage(objs.script, objs.trip, context, player);
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
  const user = await models.User.findById(req.params.userId);
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
  const objss = await Promise.map(playersByDeparture, (player) => (
    TripUtil.getObjectsForTrip(player.tripId)
  ));
  const pages = _(players)
    .map((player, i) => {
      const objs = objss[i];
      const context = TripUtil.createEvalContext(objs);
      return getPage(objs.script, objs.trip, context, player);
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
