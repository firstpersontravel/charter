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

function getPanel(script, playthrough, context, panel) {
  const panelType = supportedPartials[panel.type] ? panel.type : 'default';
  const customParams = supportedPartials[panelType](script, context, panel);
  return Object.assign(customParams, {
    type: 'panels/' + panelType,
    panel: panel,
    playthrough: playthrough
  });
}

/**
 * Construct an object of the page
 */
function getPage(script, playthrough, context, participant) {
  const pageInfo = fptCore.ParticipantCore.getPageInfo(script, context,
    participant);
  if (!pageInfo) {
    return null;
  }
  const pagesetSort = fptCore.ParticipantCore.getSceneSort(script, context,
    participant);
  const localSceneStart = pageInfo.pagesetStart ?
    pageInfo.pagesetStart.clone().tz(script.timezone) :
    null;
  const pagesetDisabledStart = localSceneStart ?
    ('- Starts ' + localSceneStart.format('h:mma')) : '';
  const pageset = pageInfo.pageset;
  const introText = fptCore.EvalCore.templateText(context, pageset.intro,
    script.timezone);
  const page = pageInfo.page;
  const directiveText = fptCore.EvalCore.templateText(context,
    page.directive, script.timezone);
  const panels = _(page.panels || [])
    .filter(panel => !panel.if || fptCore.EvalCore.if(context, panel.if))
    .map(panel => getPanel(script, playthrough, context, panel))
    .value();
  return {
    scriptTitle: script.title,
    playthrough: playthrough,
    participant: participant,
    page: page,
    panels: panels,
    pageInfo: pageInfo,
    pageset: pageset,
    pagesetDisabledStart: pagesetDisabledStart,
    pagesetDisabledIntro: introText,
    pagesetDisabledMessage: pageset.disabled_message || 'Not ready to start',
    sort: pagesetSort,
    directiveText: directiveText
  };
}

/**
 * List all actors.
 */
const actorsListRoute = async (req, res) => {
  const participants = await models.Participant.findAll({
    where: { userId: { [Sequelize.Op.not]: null } },
    include: [{
      model: models.Playthrough,
      as: 'playthrough',
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
  const actorParticipants = participants.filter(((participant) => {
    const roles = participant.playthrough.script.content.roles;
    const role = _.find(roles, { name: participant.roleName });
    return role && role.actor;
  }));
  const users = _.uniqBy(_.map(actorParticipants, 'user'), 'id');
  res.render('actor/actors', {
    layout: 'actor',
    users: users
  });
};

/**
 * Show a single participant (even if they have no user).
 */
const participantShowRoute = async (req, res) => {
  const participantId = req.params.participantId;
  const participant = await models.Participant.findById(participantId);
  if (!participant) {
    res.redirect('/actor');
    return;
  }
  const objs = await (
    TripUtil.getObjectsForPlaythrough(participant.playthroughId)
  );
  const context = TripUtil.createContext(objs);
  const page = getPage(objs.script, objs.playthrough, context, participant);
  const pages = page ? [Object.assign(page, { isFirst: true })] : [];
  const params = {
    userId: '',
    userName: participant.roleName,
    pages: pages,
    stage: config.env.STAGE,
    playthroughIds: participant.playthroughId
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
};

/**
 * Show a user, including all active participants.
 */
const userShowRoute = async (req, res) => {
  const user = await models.User.findById(req.params.userId);
  if (!user) {
    res.redirect('/actor');
    return;
  }
  const participants = await models.Participant.findAll({
    where: { userId: user.id },
    include: [{
      model: models.Playthrough,
      as: 'playthrough',
      where: { isArchived: false }
    }]
  });
  const participantsByDeparture = _(participants)
    .sortBy(participant => participant.playthrough.departureName)
    .value();
  const objss = await Promise.map(participantsByDeparture, (participant) => (
    TripUtil.getObjectsForPlaythrough(participant.playthroughId)
  ));
  const pages = _(participants)
    .map((participant, i) => {
      const objs = objss[i];
      const context = TripUtil.createContext(objs);
      return getPage(objs.script, objs.playthrough, context, participant);
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
    playthroughIds: _.map(participants, 'playthroughId').join(',')
  };
  if (req.query.is_partial) {
    res.render('partials/actor', Object.assign({ layout: false }, params));
  } else {
    res.render('actor/actor', Object.assign({ layout: 'actor' }, params));
  }
};

module.exports = {
  actorsListRoute,
  participantShowRoute,
  userShowRoute
};
