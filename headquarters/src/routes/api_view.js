const Evaluator = require('fptcore/src/utils/evaluator');
const coreRegistry = require('fptcore/src/core-registry');

const models = require('../models');
const KernelUtil = require('../kernel/util');

const evaluator = new Evaluator(coreRegistry);

const defaultInterface = {
  type: 'simple',
  section: null
};

const defaultContentPages = [{
  panels: [{ type: 'current_page' }]
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
      panel.type === 'current_page' ? currentPage.panels : [panel]
    ));
  return {
    panels: panels.map(panel => prepPanel(panel))
  };
}

function prepInterface(scriptContent, trip, player, actionContext) {
  const role = scriptContent.roles.find(r => r.name === player.roleName);
  const interface = role.interface ?
    scriptContent.interfaces.find(l => l.name === role.interface) :
    defaultInterface;
  const sectionName = interface.section;
  const contentPagesInSection = (scriptContent.content_pages || [])
    .filter(p => p.section === sectionName);
  const contentPages = contentPagesInSection.length > 0 ?
    contentPagesInSection :
    defaultContentPages;
  const preparedContentPages = contentPages
    .map(p => prepContentPage(scriptContent, trip, player, p, actionContext));
  return {
    type: interface.type,
    contentPages: preparedContentPages
  };
}

async function getPlayerViewRoute(req, res) {
  const playerId = req.params.playerId;
  const player = await models.Player.getByPk(playerId);
  const objs = await KernelUtil.getObjectsForTrip(player.tripId);
  const actionContext = KernelUtil.prepareActionContext(objs);
  const scriptContent = objs.script.content;
  const interface = prepInterface(scriptContent, objs.trip, player,
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
