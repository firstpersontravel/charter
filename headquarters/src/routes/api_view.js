const moment = require('moment-timezone');

const coreRegistry = require('fptcore/src/core-registry');
const coreEvaluator = require('fptcore/src/core-evaluator');

const models = require('../models');
const KernelUtil = require('../kernel/util');

const defaultInterface = { tabs: [{ panels: [{ type: 'current_page' }] }] };

function prepPanel(panel, actionContext) {
  const panelComponent = coreRegistry.panels[panel.type];
  if (panelComponent.export) {
    return panelComponent.export(panel, actionContext);
  }
  return null;
}

function prepTab(scriptContent, trip, tab, actionContext) {
  const roleName = actionContext.currentRoleName;
  const currentPageName = trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = scriptContent.pages
    .find(p => p.name === currentPageName);
  const panels = tab.panels
    .filter(panel => coreEvaluator.if(actionContext, panel.visible_if))
    .flatMap(panel => (
      panel.type === 'current_page' ? currentPage.panels : [panel]
    ));
  return {
    title: tab.title,
    panels: panels.map(panel => prepPanel(panel, actionContext))
  };
}

function prepInterface(scriptContent, trip, actionContext) {
  const roleName = actionContext.currentRoleName;
  const role = scriptContent.roles.find(r => r.name === roleName);
  const interface = role.interface ?
    scriptContent.interfaces.find(l => l.name === role.interface) :
    defaultInterface;
  const tabs = interface.tabs && interface.tabs.length ?
    interface.tabs : defaultInterface.tabs;
  return {
    tabs: tabs
      .filter(tab => coreEvaluator.if(actionContext, tab.visible_if))
      .map(p => prepTab(scriptContent, trip, p, actionContext))
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = req.params.playerId;
  const player = await models.Player.findByPk(playerId);
  const objs = await KernelUtil.getObjectsForTrip(player.tripId);
  const actionContext = KernelUtil.prepareActionContext(objs, moment.utc(),
    player.roleName);
  const scriptContent = objs.script.content;
  const interface = prepInterface(scriptContent, objs.trip, actionContext);
  res.json({
    data: {
      interface: interface
    }
  });
}

module.exports = {
  getPlayerViewRoute
};
