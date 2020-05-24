const express = require('express');

const actorRoutes = require('../routes/page_actor');
const contentRoutes = require('../routes/page_content');
const entrywayRoutes = require('../routes/page_entryway');
const galleryRoutes = require('../routes/page_gallery');
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

// Actor routes
const actorRouter = express.Router();
actorRouter.get('/:orgName', asyncRoute(actorRoutes.actorsListRoute));
actorRouter.get('/:orgName/user/:userId', asyncRoute(actorRoutes.userShowRoute));
actorRouter.get('/:orgName/player/:playerId', asyncRoute(actorRoutes.playerShowRoute));

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
  shortcutRouter
};
