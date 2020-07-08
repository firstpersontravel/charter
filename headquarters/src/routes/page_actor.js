const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const Evaluator = require('fptcore/src/utils/evaluator');
const coreRegistry = require('fptcore/src/core-registry');
const PlayerCore = require('fptcore/src/cores/player');
const TemplateUtil = require('fptcore/src/utils/template');

const config = require('../config');
const models = require('../models');
const ActionContext = require('../kernel/action_context');

const evaluator = new Evaluator(coreRegistry);

const supportedPartials = {
  button: (evalContext, player, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone,
      player.roleName)
  }),
  text: (evalContext, player, panel, timezone) => ({
    paragraphs: TemplateUtil
      .templateText(evalContext, panel.text, timezone, player.roleName)
      .split('\n')
      .filter(Boolean)
  }),
  choice: (evalContext, player, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone),
    choices: _.map(panel.choices, choice => (
      Object.assign({}, choice, {
        isChosen: TemplateUtil.lookupRef(evalContext, panel.value_ref,
          player.roleName) === choice.value
      })
    ))
  }),
  yesno: (evalContext, player, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone,
      player.roleName),
    isYes: TemplateUtil.lookupRef(evalContext, panel.value_ref,
      player.roleName) === true,
    isNo: TemplateUtil.lookupRef(evalContext, panel.value_ref,
      player.roleName) === false
  }),
  default: () => ({})
};

function getPanel(trip, player, evalContext, timezone, pageInfo, panel) {
  const panelType = supportedPartials[panel.type] ? panel.type : 'default';
  const customParams = supportedPartials[panelType](evalContext, player, panel,
    timezone);
  return Object.assign(panel, customParams, {
    type: 'panels/' + panelType,
    panelId: panel.id,
    roleName: player.roleName,
    sceneTitle: pageInfo.scene.title,
    tripId: trip.id,
    isPageActive: pageInfo.page.scene === trip.tripState.currentSceneName
  });
}

/**
 * Construct an object of the page
 */
function getPage(actionContext, player) {
  const script = actionContext._objs.script;
  const trip = actionContext._objs.trip;
  const evalContext = actionContext.evalContext;
  const timezone = actionContext._objs.experience.timezone;
  const pageInfo = PlayerCore.getPageInfo(script, evalContext, trip, player);
  if (!pageInfo) {
    return null;
  }
  const sort = PlayerCore.getSceneSort(script, evalContext, trip, player);
  const page = pageInfo.page;
  const directiveText = TemplateUtil.templateText(evalContext,
    page.directive, timezone);
  const panels = _(page.panels || [])
    .filter(panel => evaluator.if(actionContext, panel.visible_if))
    .map(panel => getPanel(trip, player, evalContext, timezone, pageInfo,
      panel))
    .value();
  const role = _.find(script.content.roles, { name: player.roleName });
  return {
    experienceTitle: actionContext._objs.experience.title,
    tripId: trip.id,
    tripTitle: trip.title,
    player: player,
    roleTitle: role.title,
    pageName: page.name,
    panels: panels,
    pageInfo: pageInfo,
    sort: sort,
    directiveText: directiveText
  };
}

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
    }, {
      model: models.Org,
      as: 'org',
      where: { id: org.id }
    }]
  });
  // Just show all users for now. How to filter for actors; figure out later.
  const users = _.uniqBy(_.map(players, 'user'), 'id');
  res.render('actor/actors', {
    layout: 'actor',
    orgName: org.name,
    orgTitle: org.title,
    users: users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    }))
  });
};

/**
 * Show a single player (even if they have no user).
 */
const playerShowRoute = async (req, res) => {
  const playerId = req.params.playerId;
  const player = await models.Player.findOne({
    where: { id: playerId },
    include: [{
      model: models.Org,
      as: 'org',
      where: { name: req.params.orgName }
    }]
  });
  if (!player) {
    res.redirect(`/actor/${req.params.orgName}`);
    return;
  }
  const actionContext = await ActionContext.createForTripId(player.tripId, moment.utc(), player.roleName);
  const page = getPage(actionContext, player);
  const pages = page ? [Object.assign(page, { isFirst: true })] : [];
  const role = (actionContext._objs.script.content.roles || [])
    .find(role => role.name === player.roleName);
  const params = {
    pubsubUrl: config.env.FRONTEND_PUBSUB_URL,
    userId: '',
    userName: role ? role.title : 'Unknown role',
    orgName: req.params.orgName,
    orgTitle: actionContext._objs.trip.org.title,
    pages: pages,
    stage: config.env.HQ_STAGE,
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
  const user = await models.User.findOne({
    where: { id: req.params.userId },
    include: [{
      model: models.Org,
      as: 'org',
      where: { name: req.params.orgName }
    }]
  });
  if (!user) {
    res.redirect(`/actor/${req.params.orgName}`);
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
  const playersByTripTime = _(players)
    .sortBy(player => player.trip.createdAt)
    .value();

  const actionContexts = await Promise.all(playersByTripTime.map(player => (
    ActionContext.createForTripId(player.tripId, moment.utc(), player.roleName)
  )));

  const pages = _(players)
    .map((player, i) => getPage(actionContexts[i], player))
    .filter(Boolean)
    .sortBy('sort')
    .map((page, i) => Object.assign(page, { isFirst: i === 0 }))
    .value();

  const params = {
    pubsubUrl: config.env.FRONTEND_PUBSUB_URL,
    userId: req.params.userId,
    orgName: req.params.orgName,
    orgTitle: user.org.title,
    userName: `${user.firstName} ${user.lastName}`,
    pages: pages,
    stage: config.env.HQ_STAGE,
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
