const Evaluator = require('./utils/evaluator').default;
const coreRegistry = require('./core-registry').default;

export default new Evaluator(coreRegistry);
