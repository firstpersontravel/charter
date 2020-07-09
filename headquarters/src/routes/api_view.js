const moment = require('moment-timezone');

const coreRegistry = require('fptcore/src/core-registry');
const coreEvaluator = require('fptcore/src/core-evaluator');

const models = require('../models');
const ActionContext = require('../kernel/action_context');

const defaultInterface = { tabs: [{ panels: [{ type: 'current_page' }] }] };

function exportPanel(panel, actionContext) {
  const panelComponent = coreRegistry.panels[panel.type];
  if (panelComponent.export) {
    return {
      type: panel.type,
      data: panelComponent.export(panel, actionContext)
    };
  }
  return null;
}

function exportTab(tab, actionContext) {
  const trip = actionContext._objs.trip;
  const roleName = actionContext.currentRoleName;
  const currentPageName = trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = actionContext.scriptContent.pages
    .find(p => p.name === currentPageName);
  const panels = tab.panels
    .filter(panel => coreEvaluator.if(actionContext, panel.visible_if))
    .flatMap(panel => (
      panel.type === 'current_page' ? currentPage.panels : [panel]
    ));
  return {
    title: tab.title,
    panels: panels.map(panel => exportPanel(panel, actionContext))
  };
}

function exportInterface(actionContext) {
  const roleName = actionContext.currentRoleName;
  const role = actionContext.scriptContent.roles.find(r => r.name === roleName);
  const interface = role.interface ?
    actionContext.scriptContent.interfaces.find(l => l.name === role.interface) :
    defaultInterface;
  const tabs = interface.tabs && interface.tabs.length ?
    interface.tabs : defaultInterface.tabs;
  return {
    tabs: tabs
      .filter(tab => coreEvaluator.if(actionContext, tab.visible_if))
      .map(p => exportTab(p, actionContext))
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = req.params.playerId;
  const player = await models.Player.findByPk(playerId);
  const actionContext = await ActionContext.createForTripId(player.tripId, moment.utc(),
    player.roleName);
  const interface = exportInterface(actionContext);
  res.json({
    data: {
      interface: interface
    }
  });
}

module.exports = {
  getPlayerViewRoute
};
