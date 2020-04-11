const Evaluator = require('fptcore/src/utils/evaluator');
const Registry = require('fptcore/src/registry/registry');

const models = require('../models');
const KernelUtil = require('../kernel/util');

const evaluator = new Evaluator(Registry);

const defaultLayout = {
  type: 'simple',
  section: null
};

const defaultContentPages = [{
  panels: [{
    type: 'outlet',
    name: 'main'
  }]
}];

function prepPanel(panel) {
  return panel;
}

function prepContentPage(scriptContent, trip, player, contentPage,
  actionContext) {
  const roleName = player.roleName;
  const currentPageName = trip.tripState.currentPageNamesByRole[roleName];
  const currentPage = scriptContent.pages
    .find(p => p.name === currentPageName);
  const panels = contentPage.panels
    .filter(panel => evaluator.if(actionContext, panel.visible_if))
    .flatMap(panel => (
      panel.type === 'outlet' ? currentPage.panels : [panel]
    ));
  return {
    panels: panels.map(panel => prepPanel(panel))
  };
}

function prepLayout(scriptContent, trip, player, actionContext) {
  const role = scriptContent.roles.find(r => r.name === player.roleName);
  const layout = role.layout ?
    scriptContent.layouts.find(l => l.name === role.layout) :
    defaultLayout;
  const sectionName = layout.section;
  const contentPagesInSection = (scriptContent.content_pages || [])
    .filter(p => p.section === sectionName);
  const contentPages = contentPagesInSection.length > 0 ?
    contentPagesInSection :
    defaultContentPages;
  const preparedContentPages = contentPages
    .map(p => prepContentPage(scriptContent, trip, player, p, actionContext));
  return {
    type: layout.type,
    contentPages: preparedContentPages
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = req.params.playerId;
  const player = await models.Player.getByPk(playerId);
  const objs = await KernelUtil.getObjectsForTrip(player.tripId);
  const actionContext = KernelUtil.prepareActionContext(objs);
  const scriptContent = objs.script.content;
  const layout = prepLayout(scriptContent, objs.trip, player, actionContext);
  res.json({
    data: {
      layout: layout
    }
  });
}

module.exports = {
  getPlayerViewRoute
};
