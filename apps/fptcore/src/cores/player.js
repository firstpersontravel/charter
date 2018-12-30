var _ = require('lodash');
var moment = require('moment-timezone');

var EvalCore = require('./eval');

var PlayerCore = {};

PlayerCore.getInitialFields = function(scriptContent, roleName, variantNames) {
  var role = _.find(scriptContent.roles, { name: roleName });
  var firstPageName = role.starting_page || '';
  var variants = scriptContent.variants || [];
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
    acknowledgedPageName: '',
    acknowledgedPageAt: null
  };
};

PlayerCore.getPageInfo = function(script, evalContext, player) {
  var page = _.find(script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return null;
  }
  var scene = _.find(script.content.scenes, { name: page.scene }) ||
    { name: 'No scene', title: 'No scene' };
  var appearance = _.find(script.content.appearances, { name: page.appearance }) ||
    { name: 'No appearance', title: 'No appearance' };

  var appearanceIsActive = !appearance.if ||
    EvalCore.if(evalContext, appearance.if);
  var pageTitle = page ? page.title : player.currentPageName;
  var appearanceTitle = appearanceIsActive ? pageTitle : appearance.disabled_message;
  var appearanceStart = appearance.start ?
    moment.utc(evalContext.schedule[appearance.start]) :
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

PlayerCore.getSceneSort = function(script, context, player) {
  var page = _.find(script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return 0;
  }
  var appearance = _.find(script.content.appearances, {
    name: page.appearance
  });
  if (!appearance || !appearance.start) {
    return 0;
  }
  return moment.utc(context.schedule[appearance.start]).unix();
};

module.exports = PlayerCore;
