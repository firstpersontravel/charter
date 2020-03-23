const _ = require('lodash');
const Sequelize = require('sequelize');

const Evaluator = require('fptcore/src/utils/evaluator');
const Registry = require('fptcore/src/registry/registry');
const PlayerCore = require('fptcore/src/cores/player');
const TemplateUtil = require('fptcore/src/utils/template');

const config = require('../config');
const models = require('../models');
const KernelUtil = require('../kernel/util');

const evaluator = new Evaluator(Registry);

const supportedPartials = {
  button: (evalContext, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone)
  }),
  text: (evalContext, panel, timezone) => ({
    paragraphs: TemplateUtil
      .templateText(evalContext, panel.text, timezone)
      .split('\n')
      .filter(Boolean)
  }),
  choice: (evalContext, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone),
    choices: _.map(panel.choices, choice => (
      Object.assign({}, choice, {
        isChosen: TemplateUtil.lookupRef(evalContext, panel.value_ref) ===
          choice.value
      })
    ))
  }),
  yesno: (evalContext, panel, timezone) => ({
    text: TemplateUtil.templateText(evalContext, panel.text, timezone),
    isYes: TemplateUtil.lookupRef(evalContext, panel.value_ref) === true,
    isNo: TemplateUtil.lookupRef(evalContext, panel.value_ref) === false
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
function getPage(objs, actionContext, player) {
  const script = objs.script;
  const trip = objs.trip;
  const evalContext = actionContext.evalContext;
  const timezone = objs.experience.timezone;
  const pageInfo = PlayerCore.getPageInfo(script, evalContext, player);
  if (!pageInfo) {
    return null;
  }
  const appearanceSort = PlayerCore.getSceneSort(script, evalContext, player);
  const appearance = pageInfo.appearance;
  const page = pageInfo.page;
  const directiveText = TemplateUtil.templateText(evalContext,
    page.directive, timezone);
  const panels = _(page.panels || [])
    .filter(panel => evaluator.if(actionContext, panel.visible_if))
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
  const actorPlayers = players.filter(((player) => {
    const roles = player.trip.script.content.roles;
    const role = _.find(roles, { name: player.roleName });
    return role && role.type === 'performer';
  }));
  const users = _.uniqBy(_.map(actorPlayers, 'user'), 'id');
  res.render('actor/actors', {
    layout: 'actor',
    orgName: org.name,
    orgTitle: org.title,
    users: users
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
  const objs = await KernelUtil.getObjectsForTrip(player.tripId);
  const actionContext = KernelUtil.prepareActionContext(objs);
  const page = getPage(objs, actionContext, player);
  const pages = page ? [Object.assign(page, { isFirst: true })] : [];
  const role = (objs.script.content.roles || [])
    .find(role => role.name === player.roleName);
  const params = {
    userId: '',
    userName: role ? role.title : 'Unknown role',
    orgName: req.params.orgName,
    orgTitle: objs.trip.org.title,
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
  const playersByDeparture = _(players)
    .sortBy(player => player.trip.departureName)
    .value();

  const objsList = await Promise.all(playersByDeparture.map(player => (
    KernelUtil.getObjectsForTrip(player.tripId)
  )));

  const pages = _(players)
    .map((player, i) => {
      const objs = objsList[i];
      const actionContext = KernelUtil.prepareActionContext(objs);
      return getPage(objs, actionContext, player);
    })
    .filter(Boolean)
    .sortBy('sort')
    .map((page, i) => Object.assign(page, { isFirst: i === 0 }))
    .value();

  const params = {
    userId: req.params.userId,
    orgName: req.params.orgName,
    orgTitle: user.org.title,
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
