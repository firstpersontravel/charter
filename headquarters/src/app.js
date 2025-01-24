require('module-alias/register');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const expressHandlebars  = require('express-handlebars');
const fs = require('fs');
const path = require('path');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const config = require('./config');
const models = require('./models');
const { initTracing } = require('./sentry');

const apiRouter = require('./routers/api');
const authRouter = require('./routers/auth');
const logMiddleware = require('./middleware/log');
const hostMiddleware = require('./middleware/host');
const httpsMiddleware = require('./middleware/https');
const s3Router = require('./routers/s3');
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
  tracesSampleRate: 0.1
});

initTracing(models);

// Initialize server
app.enable('trust proxy');
app.use(Sentry.Handlers.requestHandler());
app.use(traceMiddleware());
app.use(bodyParser.json({ limit: '1024kb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// Catch errors thrown in body parsing
app.use(function (err, req, res, next) {
  // Thrown on invalid JSON
  if (err instanceof SyntaxError) {
    res.status(400);
    res.json({ error: { message: 'Invalid JSON'} });
    return;
  }
  // See https://github.com/expressjs/body-parser/blob/master/README.md#request-aborted
  if (err.type === 'request.aborted') {
    res.status(400);
    res.json({ error: { message: 'Aborted request'} });
    return;
  }
  next();
});

app.use(cookieParser());
app.use(cors());

// CORS Headers
app.use(function corsHeadersMiddleware(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// Health check - before HTTPS redirect
app.get('/health', (req, res) => res.send('ok'));

app.use(httpsMiddleware);
app.use(hostMiddleware);
app.use(logMiddleware);

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
app.use('/s3', s3Router);

// Version for frontend
app.get('/version', (req, res) => res.json({ version: config.env.GIT_HASH || '' }));

// Serve static content for built travel app and agency app
const root = path.dirname(path.dirname(path.resolve(__dirname)));
const serveFile = f => (req, res) => res.sendFile(path.resolve(root, f));
app.use('/static', express.static(path.join(root, 'static')));
app.use('/build', express.static(path.join(root, 'build')));
app.use('/travel/dist', express.static(path.join(root, 'apps/travel/dist')));
app.use('/assets', express.static(path.join(root, 'apps/travel/dist/assets')));
app.use('/favicon.ico', serveFile('static/images/favicon.png'));

// Serve one-page travel app with secret insertions from server environment.
app.use('/travel', (req, res) => {
  const index = fs.readFileSync(path.join(root, 'apps/travel/dist/index.html'), 'utf-8');
  const insertion = `
  <script>
  window.TRAVEL_STAGE = "${config.env.HQ_STAGE}";
  window.TRAVEL_SENTRY_DSN = "${config.env.TRAVEL_SENTRY_DSN}";
  window.TRAVEL_SENTRY_ENVIRONMENT = "${config.env.TRAVEL_SENTRY_ENVIRONMENT}";
  window.TRAVEL_UPLOAD_ACCESS_KEY = "${config.env.TRAVEL_UPLOAD_ACCESS_KEY}";
  window.TRAVEL_UPLOAD_BUCKET = "${config.env.TRAVEL_UPLOAD_BUCKET}";
  window.TRAVEL_UPLOAD_POLICY_BASE64 = "${config.env.TRAVEL_UPLOAD_POLICY_BASE64}";
  window.TRAVEL_UPLOAD_SIGNATURE = "${config.env.TRAVEL_UPLOAD_SIGNATURE}";
  </script>
  `;
  const indexWithRuntimeVars = index.replace('<body>', `<body>${insertion}`);
  res.status(200).set('Content-Type', 'text/html').send(indexWithRuntimeVars);
});

// Serve one-page travel2 app
app.use('/travel2', (req, res) => {
  res.render('travel2/index', {
    layout: null,
    googleApiKey: config.env.FRONTEND_GOOGLE_API_KEY,
    envJson: JSON.stringify({
      FRONTEND_ANALYTICS_ENABLED: config.env.FRONTEND_ANALYTICS_ENABLED,
      FRONTEND_CONTENT_BUCKET: config.env.FRONTEND_CONTENT_BUCKET,
      FRONTEND_GOOGLE_API_KEY: config.env.FRONTEND_GOOGLE_API_KEY,
      FRONTEND_SENTRY_DSN: config.env.FRONTEND_SENTRY_DSN,
      FRONTEND_SENTRY_ENVIRONMENT: config.env.FRONTEND_SENTRY_ENVIRONMENT,
      FRONTEND_SERVER_URL: config.env.FRONTEND_SERVER_URL,
      FRONTEND_STAGE: config.env.HQ_STAGE || '',
      GIT_HASH: config.env.GIT_HASH || ''
    })
  });
});

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
      FRONTEND_STAGE: config.env.HQ_STAGE || '',
      GIT_HASH: config.env.GIT_HASH || ''
    })
  });
});

// The error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Fallthrough error handler
// eslint-disable-next-line no-unused-vars
app.use(function errorHandler(err, req, res, next) {
  config.logger.error({ name: 'error' }, err.stack);
  const errorResponse = { message: err.message };
  res.status(500);
  res.json({ error: errorResponse });
});

module.exports = app;
