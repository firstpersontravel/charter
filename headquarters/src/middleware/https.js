// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.
function httpsMiddleware(req, res, next) {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.headers.host}${req.url}`);
    return;
  }
  // request was via https, so do no special handling
  next();
}

module.exports = httpsMiddleware;