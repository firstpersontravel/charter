const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const Raven = require('raven');
const s3Router = require('react-s3-uploader/s3router');

const config = require('./config');

const apiRouter = require('./routers/api');
const authRouter = require('./routers/auth');
const twilioRouter = require('./routers/twilio');
const {
  actorRouter,
  contentRouter,
  galleryRouter,
  shortcutRouter
} = require('./routers/page');

// Configure raven
Raven.config(config.env.SENTRY_DSN).install();

// Initialize server
const app = express();
app.enable('trust proxy');
app.use(Raven.requestHandler());
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
app.use('/endpoints/twilio', twilioRouter);
app.use('/gallery', galleryRouter);
app.use('/s', shortcutRouter);

// S3 signing url
app.use('/s3', s3Router({
  bucket: config.env.S3_CONTENT_BUCKET,
  ACL: 'public-read',
  uniquePrefix: false
}));

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
