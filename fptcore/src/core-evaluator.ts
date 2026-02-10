const Evaluator = require('./utils/evaluator');
const coreRegistry = require('./core-registry');

module.exports = new Evaluator(coreRegistry);

export {};
