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
const { createTripToken, createParticipantToken } = require('../routes/auth');

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
    panelType: panel.type,
    panelPartial: 'panels/' + panelType,
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
  const participants = _.uniqBy(_.map(players, 'participant'), 'id');
  res.render('actor/actors', {
    layout: 'actor',
    orgName: org.name,
    orgTitle: org.title,
    participants: participants.map(participant => ({
      id: participant.id,
      name: participant.name,
      experienceTitle: players
        .find(p => p.participant.id === participant.id)
        .trip.experience.title,
      roleTitles: players
        .filter(p => p.participant.id === participant.id)
        .map(p => _.get(p.trip.script.content.roles.find(r => r.name === p.roleName), 'title'))
        .filter(Boolean)
        .join(', ')
    }))
  });
};

/**
 * Show a single player (even if they have no participant).
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
  const actionContext = await ActionContext.createForTripId(player.tripId, playerId, moment.utc());
  const trip = actionContext._objs.trip;
  const page = getPage(actionContext, player);
  const pages = page ? [Object.assign(page, { isFirst: true })] : [];
  const role = (actionContext._objs.script.content.roles || [])
    .find(role => role.name === player.roleName);
  const params = {
    participantId: '',
    participantName: role ? role.title : 'Unknown role',
    orgName: req.params.orgName,
    orgTitle: trip.org.title,
    pages: pages,
    stage: config.env.HQ_STAGE,
    tripIds: player.tripId
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    // Create an auth token on loading the full page.
    params.authToken = createTripToken(trip, 86400);
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
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
  const playersByTripTime = _(players)
    .sortBy(player => player.trip.createdAt)
    .value();

  const actionContexts = await Promise.all(playersByTripTime.map(player => (
    ActionContext.createForTripId(player.tripId, player.id, moment.utc())
  )));

  const pages = _(players)
    .map((player, i) => getPage(actionContexts[i], player))
    .filter(Boolean)
    .sortBy('sort')
    .map((page, i) => Object.assign(page, { isFirst: i === 0 }))
    .value();

  const params = {
    participantId: req.params.participantId,
    orgName: req.params.orgName,
    orgTitle: participant.org.title,
    participantName: `${participant.firstName} ${participant.lastName}`,
    pages: pages,
    stage: config.env.HQ_STAGE,
    tripIds: _.map(players, 'tripId').join(',')
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    // Create a one-day token on loading the full page.
    params.authToken = createParticipantToken(participant, 86400);
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
};

module.exports = {
  actorsListRoute,
  playerShowRoute,
  participantShowRoute
};
