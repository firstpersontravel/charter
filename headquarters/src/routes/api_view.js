const moment = require('moment-timezone');

const Interface = require('fptcore/src/modules/pages/interface');
const coreRegistry = require('fptcore/src/core-registry');
const coreEvaluator = require('fptcore/src/core-evaluator');
const TemplateUtil = require('fptcore/src/utils/template');

const models = require('../models');
const ActionContext = require('../kernel/action_context');

const defaultInterface = { tabs: [{ panels: [{ type: 'current_page' }] }] };

function exportPanel(panel, actionContext) {
  const panelComponent = coreRegistry.panels[panel.type];
  if (panelComponent.export) {
    return {
      id: panel.id,
      type: panel.type,
      data: panelComponent.export(panel, actionContext)
    };
  }
  return null;
}

function exportTab(tab, actionContext) {
  const trip = actionContext._objs.trip;
  const roleName = actionContext.triggeringRoleName;
  const currentPageName = trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = actionContext.scriptContent.pages
    .find(p => p.name === currentPageName);
  const panels = tab.panels
    .filter(panel => coreEvaluator.if(actionContext, panel.visible_if))
    .flatMap(panel => {
      if (panel.type === 'current_page') {
        return currentPage ? currentPage.panels : [];
      }
      return panel;
    })
    .filter(Boolean);
  return {
    title: tab.title || null,
    panels: panels.map(panel => exportPanel(panel, actionContext))
  };
}

function exportInterfaceStyle(interface) {
  return {
    background_color: (interface.background_color || Interface.properties.background_color.default),
    header_color: (interface.header_color || Interface.properties.header_color.defaultull),
    accent_color: (interface.accent_color || Interface.properties.accent_color.default),
    primary_color: (interface.primary_color || Interface.properties.primary_color.default),
    font_family: (interface.font_family || Interface.properties.font_family.default),
    custom_css: (interface.custom_css || '')
  };
}

function exportInterface(actionContext) {
  const experience = actionContext._objs.experience;
  const trip = actionContext._objs.trip;
  const roleName = actionContext.triggeringRoleName;
  const role = actionContext.scriptContent.roles.find(r => r.name === roleName);
  const interface = (role && role.interface) ?
    actionContext.scriptContent.interfaces.find(l => l.name === role.interface) :
    defaultInterface;
  const currentPageName = trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = actionContext.scriptContent.pages
    .find(p => p.name === currentPageName);
  const headline = (currentPage && currentPage.directive) || experience.title;
  const headlineTemplated = TemplateUtil.templateText(trip.evalContext, headline,
    experience.timezone, roleName);

  const tabs = interface.tabs && interface.tabs.length ?
    interface.tabs : defaultInterface.tabs;
  return {
    headline: headlineTemplated,
    style: exportInterfaceStyle(interface),
    tabs: tabs
      .filter(tab => coreEvaluator.if(actionContext, tab.visible_if))
      .map(p => exportTab(p, actionContext))
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = Number(req.params.playerId);
  const player = await models.Player.findByPk(playerId);
  if (!player) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const actionContext = await ActionContext.createForTripId(player.tripId, playerId, moment.utc());
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
