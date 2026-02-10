const Validator = require('./utils/validator');
const coreRegistry = require('./core-registry');

module.exports = new Validator(coreRegistry);

export {};
