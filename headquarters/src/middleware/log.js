const config = require('../config.ts');
const models = require('../models');

const ignorePrefixes = ['/static', '/build', '/travel2', '/health', '/version'];

// Cache org names in memory for fast logging
const cachedOrgNamesById = {};

async function getCachedOrgName(orgId) {
  if (!cachedOrgNamesById[orgId]) {
    const org = await models.Org.findByPk(orgId);
    cachedOrgNamesById[orgId] = org.name;
  }
  return cachedOrgNamesById[orgId];
}

function logMiddleware(req, res, next) {
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
  res.on('finish', async () => {
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
      size: parseInt(res.get('Content-Length') || 0),
      authType: req.auth ? req.auth.type : 'anon',
      orgId: res.loggingOrgId || null,
      orgName: res.loggingOrgId ? await getCachedOrgName(res.loggingOrgId) : null
    };
    config.logger.info(
      config.env.HQ_STAGE === 'development' ? devInfo : reqInfo,
      `${req.method} ${req.originalUrl} - ` +
      `${res.statusCode} ${res.statusMessage} - ` +
      `${reqDurationMsec}ms - ` +
      `${res.get('Content-Length') || 0}b sent`);
  });
  next();
}

module.exports = logMiddleware;
