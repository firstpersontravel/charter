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
  var appearance = _.find(script.content.appearances, { name: page.appearance }) ||
    { name: 'No appearance', title: 'No appearance' };

  var appearanceIsActive = !appearance.if ||
    EvalCore.if(context, appearance.if);
  var pageTitle = page ? page.title : participant.currentPageName;
  var appearanceTitle = appearanceIsActive ? pageTitle : appearance.disabled_message;
  var appearanceStart = appearance.start_ref ?
    moment.utc(EvalCore.lookupRef(context, appearance.start_ref)) :
    null;
  return {
    page: page,
    appearance: appearance,
    scene: scene,
    appearanceStart: appearanceStart,
    appearanceIsActive: appearanceIsActive,
    statusClass: appearanceIsActive ? '' : 'faint',
    status: appearanceTitle
  };
};

ParticipantCore.getSceneSort = function(script, context, participant) {
  var page = _.find(script.content.pages,
    { name: participant.currentPageName });
  if (!page) {
    return 0;
  }
  var appearance = _.find(script.content.appearances, {
    name: page.appearance
  });
  if (!appearance || !appearance.start_ref) {
    return 0;
  }
  return moment.utc(EvalCore.lookupRef(context, appearance.start_ref)).unix();
};

module.exports = ParticipantCore;
