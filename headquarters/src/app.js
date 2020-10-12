require('module-alias/register');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const path = require('path');
const Sentry = require('@sentry/node');
const s3Router = require('react-s3-uploader/s3router');
const Tracing = require('@sentry/tracing');

const config = require('./config');

const apiRouter = require('./routers/api');
const authRouter = require('./routers/auth');
const traceMiddleware = require('./middleware/trace');
const twilioRouter = require('./routers/twilio');
const {
  actorRouter,
  contentRouter,
  entrywayRouter,
  galleryRouter,
  shortcutRouter
} = require('./routers/page');

// Create app
const app = express();

// Configure Sentry
Sentry.init({
  dsn: config.env.HQ_SENTRY_DSN,
  environment: config.env.HQ_SENTRY_ENVIRONMENT,
  release: config.env.GIT_HASH,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0
});

// Initialize server
app.enable('trust proxy');
app.use(Sentry.Handlers.requestHandler());
app.use(traceMiddleware());
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

// Health check - before HTTPS redirect
app.get('/health', (req, res) => {
  res.send('ok');
});

// Version for frontend
app.get('/version', (req, res) => {
  res.json({ version: config.env.GIT_HASH || '' });
});

// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.headers.host}${req.url}`);
    return;
  }
  // request was via https, so do no special handling
  next();
});

// Log requests
const ignorePrefixes = ['/static', '/build', '/travel', '/health', '/version'];
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
      pattern: req.originalUrl.split('?')[0].replace(/\d+/g, 'xxx'),
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
  uniquePrefix: false,
  signatureExpires: 600 // signature is valid for 10 minutes
};
if (config.env.HQ_STAGE === 'staging') {
  // special case: staging bucket is in us-east-1 -- other buckets are us-west-2
  // like our ECS cluster.
  s3Opts.region = 'us-east-1';
}
app.use('/s3', s3Router(s3Opts));

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
      FRONTEND_SENTRY_DSN: config.env.FRONTEND_SENTRY_DSN,
      FRONTEND_SENTRY_ENVIRONMENT: config.env.FRONTEND_SENTRY_ENVIRONMENT,
      FRONTEND_SERVER_URL: config.env.FRONTEND_SERVER_URL,
      GIT_HASH: config.env.GIT_HASH || ''
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
