const { getCurrentHub, startTransaction } = require('@sentry/core');
const { stripUrlQueryAndFragment } = require('@sentry/utils');

// Only trace main endpoints
const tracePrefixes = [
  '/actor',
  '/api',
  '/auth',
  '/content',
  '/entry',
  '/gallery',
  '/s',
  '/endpoints/twilio'
];

function isTraceable(url) {
  for (const tracePrefix of tracePrefixes) {
    if (url.startsWith(tracePrefix)) {
      return true;
    }
  }
  return false;
}

function traceMiddleware() {
  return function sentryTracingMiddleware(req, res, next) {
    if (!isTraceable(req.originalUrl)) {
      next();
      return;
    }

    // TODO: At this point `req.route.path` (which we use in `extractTransaction`) is not available
    // but `req.path` or `req.url` should do the job as well. We could unify this here.
    const reqMethod = (req.method || '').toUpperCase();
    const reqUrl = req.originalUrl && stripUrlQueryAndFragment(req.originalUrl);
    const reqPattern = reqUrl.replace(/\d+/g, '#');

    const transaction = startTransaction({
      name: `${reqMethod} ${reqPattern}`,
      op: 'http.server'
    });

    // We put the transaction on the scope so users can attach children to it
    getCurrentHub().configureScope(scope => {
      scope.setSpan(transaction);
    });

    // We also set __sentry_transaction on the response so people can grab the transaction there to add
    // spans to it later.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    res.__sentry_transaction = transaction;

    res.once('finish', () => {
      transaction.setHttpStatus(res.statusCode);
      transaction.finish();
    });

    next();
  };
}

module.exports = traceMiddleware;