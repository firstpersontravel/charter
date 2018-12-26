const express = require('express');

const pageActorRoutes = require('../routes/page_actor');
const pageGalleryRoutes = require('../routes/page_gallery');
const pagePublicRoutes = require('../routes/page_public');
const { asyncRoute } = require('./utils');

// Create new router
const pageRouter = express.Router();

// Public routes
pageRouter.get('/', asyncRoute(pagePublicRoutes.homeRoute));
pageRouter.get('/s/:playerId',
  asyncRoute(pagePublicRoutes.playerShortcutRoute));

// Actor routes
pageRouter.get('/actor/', asyncRoute(pageActorRoutes.actorsListRoute));
pageRouter.get('/actor/:userId', asyncRoute(pageActorRoutes.userShowRoute));
pageRouter.get('/actor/player/:playerId',
  asyncRoute(pageActorRoutes.playerShowRoute));

// Gallery routes
pageRouter.get('/gallery/:year/:month/:day/:alias',
  asyncRoute(pageGalleryRoutes.galleryRoute));

module.exports = pageRouter;
