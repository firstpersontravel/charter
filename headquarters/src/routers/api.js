const express = require('express');
const Sentry = require('@sentry/node');

const apiActionsRoutes = require('../routes/api_actions');
const apiAdminRoutes = require('../routes/api_admin');
const apiLegacyRoutes = require('../routes/api_legacy');
const apiRestRoutes = require('../routes/api_rest');
const apiViewRoutes = require('../routes/api_view');
const authz = require('../authorization/authz');
const { authMiddleware } = require('../middleware/auth');
const config = require('../config');
const models = require('../models');
const { asyncRoute } = require('./utils');

const apiRouter = express.Router();
apiRouter.use(asyncRoute(authMiddleware));
apiRouter.use(Sentry.Handlers.requestHandler());

/**
 * Utility function to create a REST collection router
 */
function createModelRouter(model, opts={}) {
  // Create routes
  const routes = {
    list: apiRestRoutes.listCollectionRoute(model, authz, opts),
    create: apiRestRoutes.createRecordRoute(model, authz, opts),
    retrieve: apiRestRoutes.retrieveRecordRoute(model, authz, opts),
    replace: apiRestRoutes.replaceRecordRoute(model, authz, opts),
    replaceBulk: apiRestRoutes.replaceRecordsRoute(model, authz, opts),
    update: apiRestRoutes.updateRecordRoute(model, authz, opts),
    updateBulk: apiRestRoutes.updateRecordsRoute(model, authz, opts)
  };
  // Create and return router
  const router = express.Router();
  router.get('/', asyncRoute(routes.list));
  router.post('/', asyncRoute(routes.create));
  router.get('/:recordId', asyncRoute(routes.retrieve));
  router.put('/:recordId', asyncRoute(routes.replace));
  router.put('/', asyncRoute(routes.replaceBulk));
  router.patch('/:recordId', asyncRoute(routes.update));
  router.patch('/', asyncRoute(routes.updateBulk));
  return router;
}

// REST API routers for Organization-filtered models
const orgRecordOpts = { requireFilters: ['orgId'] };
apiRouter.use('/experiences', createModelRouter(models.Experience,
  orgRecordOpts));

const expRecordOpts = { requireFilters: ['orgId', 'experienceId'] };
apiRouter.use('/assets', createModelRouter(models.Asset, expRecordOpts));
apiRouter.use('/groups', createModelRouter(models.Group, expRecordOpts));
apiRouter.use('/participants', createModelRouter(models.Participant, expRecordOpts));
apiRouter.use('/profiles', createModelRouter(models.Profile, expRecordOpts));
apiRouter.use('/relays', createModelRouter(models.Relay, expRecordOpts));
apiRouter.use('/scripts', createModelRouter(models.Script, expRecordOpts));
apiRouter.use('/trips', createModelRouter(models.Trip, expRecordOpts));

const tripRecordOpts = { requireFilters: ['orgId', 'tripId'] };
apiRouter.use('/actions', createModelRouter(models.Action, tripRecordOpts));
apiRouter.use('/messages', createModelRouter(models.Message, tripRecordOpts));
apiRouter.use('/players', createModelRouter(models.Player, tripRecordOpts));
apiRouter.use('/log-entries', createModelRouter(models.LogEntry,
  tripRecordOpts));

// Action routes
apiRouter.post('/trips/:tripId/actions',
  asyncRoute(apiActionsRoutes.createActionRoute));
apiRouter.post('/trips/:tripId/events',
  asyncRoute(apiActionsRoutes.createEventRoute));
apiRouter.post('/trips/:tripId/device_state/:participantId',
  asyncRoute(apiActionsRoutes.updateDeviceStateRoute));

// Experience admin routes
apiRouter.post('/admin/experiences/:experienceId/update_relays',
  asyncRoute(apiAdminRoutes.updateRelaysRoute));

// Trip admin routes
apiRouter.post('/admin/trips/:tripId/notify',
  asyncRoute(apiAdminRoutes.notifyRoute));
apiRouter.post('/admin/trips/:tripId/reset',
  asyncRoute(apiAdminRoutes.resetRoute));
apiRouter.post('/admin/trips/:tripId/trigger',
  asyncRoute(apiAdminRoutes.triggerRoute));

// New traveler view data
apiRouter.get('/view/player/:playerId',
  asyncRoute(apiViewRoutes.getPlayerViewRoute));

// Legacy
apiRouter.get('/legacy/participant/:id',
  asyncRoute(apiLegacyRoutes.getParticipantRoute));
apiRouter.get('/legacy/trip/:id',
  asyncRoute(apiLegacyRoutes.getTripRoute));
apiRouter.get('/legacy/player/:id/video-token',
  asyncRoute(apiLegacyRoutes.getPlayerVideoTokenRoute));

// The error handler must be before any other error middleware
apiRouter.use(Sentry.Handlers.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
apiRouter.use(function(err, req, res, next) {
  // Log full error stack only if it's an internal error or 5XX
  if (!err.status || err.status >= 500) {
    config.logger.error({ name: 'error' }, err.stack);
  }
  const errorStatus = err.status || 500;
  const errorResponse = Object.assign({
    type: err.type,
    message: err.message
  }, err.data);
  res.status(errorStatus);
  res.json({ error: errorResponse });
});

module.exports = apiRouter;
