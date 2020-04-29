require('module-alias/register');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const path = require('path');
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
app.use(cors());

const hostRedirects = {
  'app.firstperson.travel': 'charter.firstperson.travel',
  'staging.firstperson.travel': 'beta.firstperson.travel',
};

// Host redirects
app.use((req, res, next) => {
  if (hostRedirects[req.hostname]) {
    const newHost = hostRedirects[req.hostname];
    res.redirect(`${req.protocol}://${newHost}${req.path}`);
    return;
  }
  next();
});

// CORS Headers
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// Log requests
const staticPrefixes = ['/static', '/build', '/travel/dist'];
app.use((req, res, next) => {
  // Don't log static file requests.
  for (const staticPrefix of staticPrefixes) {
    if (req.originalUrl.startsWith(staticPrefix)) {
      next();
      return;
    }
  }
  // config.logger.info({ name: 'request' },
  //   `${req.method} ${req.originalUrl} ...`);
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

// Serve static content for built travel app and agency app
const root = path.dirname(path.dirname(path.resolve(__dirname)));
const serveFile = f => (req, res) => res.sendFile(path.resolve(root, f));
app.use('/static', express.static(path.join(root, 'static')));
app.use('/build', express.static(path.join(root, 'build')));
app.use('/travel/dist', express.static(path.join(root, 'apps/travel/dist')));
app.use('/favicon.ico', serveFile('static/favicon.ico'));
app.use('/apple-touch-icon-precomposed.png',
  serveFile('static/images/apple-touch-icon-precomposed.png'));

// Serve one-page apps
app.use('/travel', serveFile('apps/travel/dist/index.html'));
app.use('', serveFile('apps/agency/static/index.html'));

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
