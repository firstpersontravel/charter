const Walker = require('./utils/walker').default;
const coreRegistry = require('./core-registry').default;

export default new Walker(coreRegistry);
