var _ = require('lodash');
var moment = require('moment-timezone');

var EvalCore = require('./eval');

var ParticipantCore = {};

ParticipantCore.getInitialFields = function (script, roleName, variantNames) {
  var role = _.find(script.content.roles, { name: roleName });
  var firstPageName = role.starting_page || '';
  var variants = script.content.variants || [];
  variantNames.forEach(function(variantName) {
    var variant = _.find(variants, { name: variantName });
    if (!variant) {
      return;
    }
    if (variant.starting_pages && variant.starting_pages[roleName]) {
      firstPageName = variant.starting_pages[roleName];
    }
  });
  return {
    roleName: roleName,
    currentPageName: firstPageName,
    values: Object.assign({}, role.initial_values)
  };
};

ParticipantCore.getPageInfo = function(script, context, participant) {
  var page = _.find(script.content.pages,
    { name: participant.currentPageName });
  if (!page) {
    return null;
  }
  var scene = _.find(script.content.scenes, { name: page.scene }) ||
    { name: 'No scene', title: 'No scene' };
  var pageset = _.find(script.content.pagesets, { name: page.pageset }) ||
    { name: 'No pageset', title: 'No pageset' };

  var pagesetIsActive = !pageset.if || EvalCore.if(context, pageset.if);
  var pageTitle = page ? page.title : participant.currentPageName;
  var pagesetTitle = pagesetIsActive ? pageTitle : pageset.disabled_message;
  var pagesetStart = pageset.start_ref ?
    moment.utc(EvalCore.lookupRef(context, pageset.start_ref)) :
    null;
  return {
    page: page,
    pageset: pageset,
    scene: scene,
    pagesetStart: pagesetStart,
    pagesetIsActive: pagesetIsActive,
    statusClass: pagesetIsActive ? '' : 'faint',
    status: pagesetTitle
  };
};

ParticipantCore.getSceneSort = function(script, context, participant) {
  var page = _.find(script.content.pages,
    { name: participant.currentPageName });
  if (!page) {
    return 0;
  }
  var pageset = _.find(script.content.pagesets, { name: page.pageset });
  if (!pageset || !pageset.start_ref) {
    return 0;
  }
  return moment.utc(EvalCore.lookupRef(context, pageset.start_ref)).unix();
};

module.exports = ParticipantCore;
