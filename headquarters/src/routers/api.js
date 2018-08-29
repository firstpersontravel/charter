const express = require('express');
const Raven = require('raven');

const apiActionsRoutes = require('../routes/api_actions');
const apiAdminRoutes = require('../routes/api_admin');
const apiLegacyRoutes = require('../routes/api_legacy');
const apiRestRoutes = require('../routes/api_rest');
const config = require('../config');
const models = require('../models');
const { asyncRoute } = require('./utils');

const apiRouter = express.Router();

/**
 * Utility function to create a REST collection router
 */
function createCollectionRouter(model, config={}) 
{
  // Create routes
  const routes = {
    list: apiRestRoutes.listCollectionRoute(model, config.list),
    create: apiRestRoutes.createRecordRoute(model, config.create),
    retrieve: apiRestRoutes.retrieveRecordRoute(model, config.retrieve),
    replace: apiRestRoutes.replaceRecordRoute(model, config.replace),
    update: apiRestRoutes.updateRecordRoute(model, config.update),
    delete: apiRestRoutes.deleteRecordRoute(model, config.delete)
  };
  // Create and return router
  const router = express.Router();
  router.get('/', asyncRoute(routes.list));
  router.post('/', asyncRoute(routes.create));
  router.get('/:recordId', asyncRoute(routes.retrieve));
  router.put('/:recordId', asyncRoute(routes.replace));
  router.patch('/:recordId', asyncRoute(routes.update));
  router.delete('/:recordId', asyncRoute(routes.delete));
  return router;
}

// REST API routes
apiRouter.use('/actions', createCollectionRouter(models.Action));
apiRouter.use('/groups', createCollectionRouter(models.Group));
apiRouter.use('/messages', createCollectionRouter(models.Message));
apiRouter.use('/participants', createCollectionRouter(models.Participant));
apiRouter.use('/profiles', createCollectionRouter(models.Profile));
apiRouter.use('/playthroughs', createCollectionRouter(models.Playthrough));
apiRouter.use('/relays', createCollectionRouter(models.Relay));
apiRouter.use('/scripts', createCollectionRouter(models.Script));
apiRouter.use('/users', createCollectionRouter(models.User));

// Action routes
apiRouter.post('/playthroughs/:playthroughId/:actionName',
  asyncRoute(apiActionsRoutes.createActionRoute));
apiRouter.post('/playthroughs/:playthroughId/events',
  asyncRoute(apiActionsRoutes.createEventRoute));
apiRouter.post('/users/:userId/device_state',
  asyncRoute(apiActionsRoutes.updateDeviceStateRoute));

// Admin routes
apiRouter.post('/admin/scripts/:scriptName/update_relays',
  asyncRoute(apiAdminRoutes.updateRelaysRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/notify',
  asyncRoute(apiAdminRoutes.notifyRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/fast_forward',
  asyncRoute(apiAdminRoutes.fastForwardRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/fast_forward_next',
  asyncRoute(apiAdminRoutes.fastForwardNextRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/reset',
  asyncRoute(apiAdminRoutes.resetRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/phrase',
  asyncRoute(apiAdminRoutes.phraseRoute));
apiRouter.post('/admin/playthroughs/:playthroughId/trigger',
  asyncRoute(apiAdminRoutes.triggerRoute));

// Legacy
apiRouter.get('/legacy/user/:id',
  asyncRoute(apiLegacyRoutes.getUserRoute));
apiRouter.get('/legacy/playthrough/:id',
  asyncRoute(apiLegacyRoutes.getPlaythroughRoute));

// The error handler must be before any other error middleware
apiRouter.use(Raven.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
apiRouter.use(function(err, req, res, next) {
  const data = Object.assign({
    type: err.type,
    message: err.message
  }, err.data);
  config.logger.error({ name: 'error' }, err.stack);
  res.status(err.status || 500);
  res.json(data);
});

module.exports = apiRouter;
