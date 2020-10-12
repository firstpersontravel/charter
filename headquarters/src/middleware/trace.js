const { getCurrentHub, startTransaction } = require('@sentry/core');
const { stripUrlQueryAndFragment } = require('@sentry/utils');

const ignorePrefixes = ['/static', '/build', '/travel', '/health', '/version'];

function traceMiddleware() {
  return function sentryTracingMiddleware(req, res, next) {
    // Don't trace static file requests.
    for (const ignorePrefix of ignorePrefixes) {
      if (req.originalUrl.startsWith(ignorePrefix)) {
        next();
        return;
      }
    }

    // TODO: At this point `req.route.path` (which we use in `extractTransaction`) is not available
    // but `req.path` or `req.url` should do the job as well. We could unify this here.
    const reqMethod = (req.method || '').toUpperCase();
    const reqUrl = req.url && stripUrlQueryAndFragment(req.url);
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