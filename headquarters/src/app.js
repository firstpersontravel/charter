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

// CORS Headers
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// Log requests
const ignorePrefixes = ['/static', '/build', '/travel/dist', '/health'];
app.use((req, res, next) => {
  // Don't log static file requests.
  for (const ignorePrefix of ignorePrefixes) {
    if (req.originalUrl.startsWith(ignorePrefix)) {
      next();
      return;
    }
  }
  const startedAt = new Date().valueOf();
  // config.logger.info({ name: 'request' },
  //   `${req.method} ${req.originalUrl} ...`);
  res.on('finish', () => {
    const reqDurationMsec = new Date().valueOf() - startedAt;
    const devInfo = { name: 'request' };
    const reqInfo = {
      name: 'request',
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      duration: reqDurationMsec,
      size: parseInt(res.get('Content-Length') || 0)
    };
    config.logger.info(
      config.env.HQ_STAGE === 'development' ? devInfo : reqInfo,
      `${req.method} ${req.originalUrl} - ` +
      `${res.statusCode} ${res.statusMessage} - ` +
      `${reqDurationMsec}ms - ` +
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
app.use('/s', shortcutRouter);
app.use('/endpoints/twilio', twilioRouter);

// S3 signing url
const s3Opts = {
  bucket: config.env.HQ_CONTENT_BUCKET,
  ACL: 'public-read',
  uniquePrefix: false
};
if (config.env.HQ_STAGE === 'staging') {
  // special case: staging bucket is in us-east-1 -- other buckets are us-west-2
  // like our ECS cluster.
  s3Opts.region = 'us-east-1';
}
app.use('/s3', s3Router(s3Opts));

// Health check
app.get('/health', (req, res) => {
  res.send('ok');
});

const hostRedirects = {
  'app.firstperson.travel': 'charter.firstperson.travel',
  'staging.firstperson.travel': 'beta.firstperson.travel',
};

// Host redirects after API endpoints but before static content -- so that
// twilio numbers connected to old hosts still work. If the old domain is
// ever deprecated, twilio numbers will need to be ported over.
app.use((req, res, next) => {
  if (hostRedirects[req.hostname]) {
    const newHost = hostRedirects[req.hostname];
    res.redirect(`${req.protocol}://${newHost}${req.originalUrl}`);
    return;
  }
  next();
});

// Serve static content for built travel app and agency app
const root = path.dirname(path.dirname(path.resolve(__dirname)));
const serveFile = f => (req, res) => res.sendFile(path.resolve(root, f));
app.use('/static', express.static(path.join(root, 'static')));
app.use('/build', express.static(path.join(root, 'build')));
app.use('/travel/dist', express.static(path.join(root, 'apps/travel/dist')));
app.use('/assets', express.static(path.join(root, 'apps/travel/dist/assets')));
app.use('/favicon.ico', serveFile('static/images/favicon.png'));
app.use('/apple-touch-icon-precomposed.png',
  serveFile('static/images/apple-touch-icon-precomposed.png'));

// Serve one-page travel app
app.use('/travel', serveFile('apps/travel/dist/index.html'));

// Serve one-page agency app
app.use('', (req, res) => {
  res.render('agency/index', {
    layout: null,
    googleApiKey: config.env.FRONTEND_GOOGLE_API_KEY,
    envJson: JSON.stringify({
      FRONTEND_ANALYTICS_ENABLED: config.env.FRONTEND_ANALYTICS_ENABLED,
      FRONTEND_CONTENT_BUCKET: config.env.FRONTEND_CONTENT_BUCKET,
      FRONTEND_GOOGLE_API_KEY: config.env.FRONTEND_GOOGLE_API_KEY,
      FRONTEND_PUBSUB_URL: config.env.FRONTEND_PUBSUB_URL,
      FRONTEND_SENTRY_DSN: config.env.FRONTEND_SENTRY_DSN,
      FRONTEND_SENTRY_ENVIRONMENT: config.env.FRONTEND_SENTRY_ENVIRONMENT,
      FRONTEND_SERVER_URL: config.env.FRONTEND_SERVER_URL,
      GIT_HASH: config.env.GIT_HASH
    })
  });
});

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
