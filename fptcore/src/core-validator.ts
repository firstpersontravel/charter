const Validator = require('./utils/validator').default;
const coreRegistry = require('./core-registry').default;

export default new Validator(coreRegistry);
