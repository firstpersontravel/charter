const express = require('express');
const Sentry = require('@sentry/node');

const apiActionsRoutes = require('../routes/api_actions');
const apiAdminRoutes = require('../routes/api_admin');
const apiLegacyRoutes = require('../routes/api_legacy');
const apiRestRoutes = require('../routes/api_rest');
const Authorizor = require('../authorization/authorizer');
const Policy = require('../authorization/policy');
const designerPolicies = require('../policies/designer');
const config = require('../config');
const models = require('../models');
const { asyncRoute } = require('./utils');

// Create authorization framework
const apiPolicy = new Policy(designerPolicies);
const apiAuthorizor = new Authorizor(apiPolicy);

const apiRouter = express.Router();

apiRouter.use(Sentry.Handlers.requestHandler());

/**
 * Utility function to create a REST collection router
 */
function createModelRouter(model, opts={}) {
  // Create routes
  const routes = {
    list: apiRestRoutes.listCollectionRoute(model, apiAuthorizor, opts),
    create: apiRestRoutes.createRecordRoute(model, apiAuthorizor, opts),
    retrieve: apiRestRoutes.retrieveRecordRoute(model, apiAuthorizor, opts),
    replace: apiRestRoutes.replaceRecordRoute(model, apiAuthorizor, opts),
    update: apiRestRoutes.updateRecordRoute(model, apiAuthorizor, opts)
  };
  // Create and return router
  const router = express.Router();
  router.get('/', asyncRoute(routes.list));
  router.post('/', asyncRoute(routes.create));
  router.get('/:recordId', asyncRoute(routes.retrieve));
  router.put('/:recordId', asyncRoute(routes.replace));
  router.patch('/:recordId', asyncRoute(routes.update));
  return router;
}

// REST API routers for Organization-filtered models
const orgOpts = { requireFilters: ['orgId'] };
apiRouter.use('/actions', createModelRouter(models.Action, orgOpts));
apiRouter.use('/assets', createModelRouter(models.Asset, orgOpts));
apiRouter.use('/experiences', createModelRouter(models.Experience, orgOpts));
apiRouter.use('/groups', createModelRouter(models.Group, orgOpts));
apiRouter.use('/messages', createModelRouter(models.Message, orgOpts));
apiRouter.use('/players', createModelRouter(models.Player, orgOpts));
apiRouter.use('/profiles', createModelRouter(models.Profile, orgOpts));
apiRouter.use('/relays', createModelRouter(models.Relay, orgOpts));
apiRouter.use('/scripts', createModelRouter(models.Script, orgOpts));
apiRouter.use('/trips', createModelRouter(models.Trip, orgOpts));

// And for users, which are shared
const userOpts = {
  requireFilters: ['orgId'],
  blacklistFields: ['passwordHash']
};
apiRouter.use('/users', createModelRouter(models.User, userOpts));

// Action routes
apiRouter.post('/trips/:tripId/actions',
  asyncRoute(apiActionsRoutes.createActionRoute));
apiRouter.post('/trips/:tripId/events',
  asyncRoute(apiActionsRoutes.createEventRoute));
apiRouter.post('/users/:userId/device_state',
  asyncRoute(apiActionsRoutes.updateDeviceStateRoute));

// Experience admin routes
apiRouter.post('/admin/experiences/:experienceId/update_relays',
  asyncRoute(apiAdminRoutes.updateRelaysRoute));

// Trip admin routes
apiRouter.post('/admin/trips/:tripId/notify',
  asyncRoute(apiAdminRoutes.notifyRoute));
apiRouter.post('/admin/trips/:tripId/fast_forward',
  asyncRoute(apiAdminRoutes.fastForwardRoute));
apiRouter.post('/admin/trips/:tripId/fast_forward_next',
  asyncRoute(apiAdminRoutes.fastForwardNextRoute));
apiRouter.post('/admin/trips/:tripId/reset',
  asyncRoute(apiAdminRoutes.resetRoute));
apiRouter.post('/admin/trips/:tripId/phrase',
  asyncRoute(apiAdminRoutes.phraseRoute));
apiRouter.post('/admin/trips/:tripId/trigger',
  asyncRoute(apiAdminRoutes.triggerRoute));

// Legacy
apiRouter.get('/legacy/user/:id',
  asyncRoute(apiLegacyRoutes.getUserRoute));
apiRouter.get('/legacy/trip/:id',
  asyncRoute(apiLegacyRoutes.getTripRoute));

// The error handler must be before any other error middleware
apiRouter.use(Sentry.Handlers.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
apiRouter.use(function(err, req, res, next) {
  config.logger.error({ name: 'error' }, err.stack);
  const errorStatus = err.status || 500;
  const errorResponse = Object.assign({
    type: err.type,
    message: err.message
  }, err.data);
  res.status(errorStatus);
  res.json({ error: errorResponse });
});

module.exports = apiRouter;
