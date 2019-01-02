const bodyParser = require('body-parser');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const Raven = require('raven');

const config = require('./config');

const apiRouter = require('./routers/api');
const twilioRouter = require('./routers/twilio');
const {
  galleryRouter,
  shortcutRouter,
  actorRouter
} = require('./routers/page');

// Configure raven
Raven.config(config.env.SENTRY_DSN).install();

// Initialize server
const app = express();
app.enable('trust proxy');
app.use(Raven.requestHandler());
app.use(bodyParser.json({ limit: '1024kb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// CORS Headers
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// Log requests
app.use((req, res, next) => {
  config.logger.info({ name: 'request' }, `${req.method} ${req.originalUrl}`);
  next();
});

// Set up template engine for actor view
app.engine('handlebars', expressHandlebars({ defaultLayout: 'public' }));
app.set('view engine', 'handlebars');

// Add API
app.use('/api', apiRouter);

// API endpoints
app.use('/endpoints/twilio', twilioRouter);

// Server-rendered view routers
app.use('/s', shortcutRouter);
app.use('/actor', actorRouter);
app.use('/gallery', galleryRouter);

// The error handler must be before any other error middleware
app.use(Raven.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  config.logger.error({ name: 'error' }, err.stack);
  const errorResponse = { message: err.message };
  res.status(500);
  res.json({ error: errorResponse });
});

module.exports = app;
