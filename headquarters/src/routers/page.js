const express = require('express');

const actorRoutes = require('../routes/page_actor');
const contentRoutes = require('../routes/page_content');
const entrywayRoutes = require('../routes/page_entryway');
const galleryRoutes = require('../routes/page_gallery');
const redirectRoutes = require('../routes/page_redirect');
const shortcutRoutes = require('../routes/page_shortcut');
const { asyncRoute } = require('./utils');

// Public routes
const entrywayRouter = express.Router();
entrywayRouter.get('/:orgName/:experienceName',
  asyncRoute(entrywayRoutes.entrywayRoute));
entrywayRouter.post('/:orgName/:experienceName',
  asyncRoute(entrywayRoutes.entrywaySubmitRoute));

const shortcutRouter = express.Router();
shortcutRouter.get('/:playerId',
  asyncRoute(shortcutRoutes.playerShortcutRoute));

const redirectRouter = express.Router();
redirectRouter.get('/', asyncRoute(redirectRoutes.redirectRoute));

// Actor routes
const actorRouter = express.Router();
actorRouter.get('/', asyncRoute(actorRoutes.actorsListRoute));
actorRouter.get('/:userId', asyncRoute(actorRoutes.userShowRoute));
actorRouter.get('/player/:playerId', asyncRoute(actorRoutes.playerShowRoute));

// Gallery routes
const galleryRouter = express.Router();
galleryRouter.get('/:year/:month/:day/:alias',
  asyncRoute(galleryRoutes.galleryRoute));

// Content routes
const contentRouter = express.Router();
contentRouter.get('/examples/:exampleName',
  asyncRoute(contentRoutes.exampleRoute));

module.exports = {
  actorRouter,
  contentRouter,
  entrywayRouter,
  galleryRouter,
  redirectRouter,
  shortcutRouter
};
