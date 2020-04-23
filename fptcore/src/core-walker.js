const Walker = require('./utils/walker');

const coreRegistry = require('./core-registry');

module.exports = new Walker(coreRegistry);
