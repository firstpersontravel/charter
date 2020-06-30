const _ = require('lodash');

const coreEvaluator = require('fptcore/src/core-evaluator');
const coreWalker = require('fptcore/src/core-walker');
const TemplateUtil = require('fptcore/src/utils/template');

const models = require('../models');
const KernelUtil = require('../kernel/util');

const defaultInterface = { tabs: [{ panels: [{ type: 'current_page' }] }] };

function prepFormattedString(scriptContent, objs, player, val, actionContext) {
  return TemplateUtil.templateText(actionContext.evalContext, val,
    objs.experience.timezone, player.roleName);
}

const fieldPrepFns = {
  string: prepFormattedString,
  markdown: prepFormattedString
};

function prepField(scriptContent, objs, player, spec, val, actionContext) {
  if (fieldPrepFns[spec.type]) {
    const prepFn = fieldPrepFns[spec.type];
    return prepFn(scriptContent, objs, player, val, actionContext);
  }
  return val;
}

function prepPanel(scriptContent, objs, player, panel, actionContext) {
  const val = _.cloneDeep(panel);
  coreWalker.walkComponent('panels', val, null, (obj, spec, parent, key) => {
    if (val === undefined) {
      return;
    }
    // No changes right now
    parent[key] = prepField(scriptContent, objs, player, spec, obj,
      actionContext);
  });
  return val;
}

function prepTab(scriptContent, objs, player, tab, actionContext) {
  const roleName = player.roleName;
  const currentPageName = objs.trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = scriptContent.pages
    .find(p => p.name === currentPageName);
  const panels = tab.panels
    .filter(panel => coreEvaluator.if(actionContext, panel.visible_if))
    .flatMap(panel => (
      panel.type === 'current_page' ? currentPage.panels : [panel]
    ));
  return {
    title: tab.title,
    panels: panels.map(panel => (
      prepPanel(scriptContent, objs, player, panel, actionContext)
    ))
  };
}

function prepInterface(scriptContent, objs, player, actionContext) {
  const role = scriptContent.roles.find(r => r.name === player.roleName);
  const interface = role.interface ?
    scriptContent.interfaces.find(l => l.name === role.interface) :
    defaultInterface;
  const tabs = interface.tabs && interface.tabs.length ?
    interface.tabs : defaultInterface.tabs;
  return {
    tabs: tabs
      .filter(tab => coreEvaluator.if(actionContext, tab.visible_if))
      .map(p => prepTab(scriptContent, objs, player, p, actionContext))
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = req.params.playerId;
  const player = await models.Player.findByPk(playerId);
  const objs = await KernelUtil.getObjectsForTrip(player.tripId);
  const actionContext = KernelUtil.prepareActionContext(objs);
  const scriptContent = objs.script.content;
  const interface = prepInterface(scriptContent, objs, player,
    actionContext);
  res.json({
    data: {
      interface: interface
    }
  });
}

module.exports = {
  getPlayerViewRoute
};
