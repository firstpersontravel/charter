const hostRedirects = {
  'app.firstperson.travel': 'charter.firstperson.travel',
  'staging.firstperson.travel': 'beta.firstperson.travel',
};

// Host redirects after API endpoints but before static content -- so that
// twilio numbers connected to old hosts still work. If the old domain is
// ever deprecated, twilio numbers will need to be ported over.
function hostMiddleware(req, res, next) {
  if (hostRedirects[req.hostname]) {
    const newHost = hostRedirects[req.hostname];
    res.redirect(`${req.protocol}://${newHost}${req.originalUrl}`);
    return;
  }
  next();
}

module.exports = hostMiddleware;