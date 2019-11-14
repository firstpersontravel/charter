const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const Sentry = require('@sentry/node');
const s3Router = require('react-s3-uploader/s3router');

const config = require('./config');

const apiRouter = require('./routers/api');
const authRouter = require('./routers/auth');
const twilioRouter = require('./routers/twilio');
const {
  actorRouter,
  contentRouter,
  entrywayRouter,
  galleryRouter,
  redirectRouter,
  shortcutRouter
} = require('./routers/page');

// Initialize server
const app = express();
app.enable('trust proxy');
app.use(Sentry.Handlers.requestHandler());
app.use(bodyParser.json({ limit: '1024kb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS Headers
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// Log requests
app.use((req, res, next) => {
  config.logger.info({ name: 'request' }, `${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    config.logger.info(
      { name: 'request' },
      `${req.method} ${req.originalUrl} - ` +
      `${res.statusCode} ${res.statusMessage} - ` +
      `${res.get('Content-Length') || 0}b sent`);
  });
  next();
});

// Set up template engine for actor view
app.engine('handlebars', expressHandlebars({ defaultLayout: 'public' }));
app.set('view engine', 'handlebars');

// Add routers
app.use('/actor', actorRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);
app.use('/content', contentRouter);
app.use('/entry', entrywayRouter);
app.use('/gallery', galleryRouter);
app.use('/r', redirectRouter);
app.use('/s', shortcutRouter);
app.use('/endpoints/twilio', twilioRouter);

// S3 signing url
app.use('/s3', s3Router({
  bucket: config.env.S3_CONTENT_BUCKET,
  ACL: 'public-read',
  uniquePrefix: false
}));

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  config.logger.error({ name: 'error' }, err.stack);
  const errorResponse = { message: err.message };
  res.status(500);
  res.json({ error: errorResponse });
});

module.exports = app;
