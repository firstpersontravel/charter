const Sentry = require('@sentry/node');

const config = require('./config');
const models = require('./models');

// Instrument query functions
const queryFunctions = [
  'findByPk',
  'findOne',
  'findAll',
  'create',
  'update',
  'destroy'
];

function patchModel(model, queryFunction) {
  const patchedName = `__${queryFunction}`;
  model[patchedName] = model[queryFunction];
  model[queryFunction] = async (...args) => {
    const transaction = Sentry.getCurrentHub()
      .getScope()
      .getTransaction();
    // If no transaction, just call
    if (!transaction) {
      return await model[patchedName].call(model, ...args);
    }
    // Otherwise call with trace
    const span = transaction.startChild({
      op: 'sequelize',
      description: `${model.name}.${queryFunction}`,
    });
    try {
      return await model[patchedName].call(model, ...args);
    } catch (err) {
      span.setHttpStatus(500);
      throw err;
    } finally {
      span.setHttpStatus(200);
      span.finish();
    }
  };
}

function initSentry() {
  if (config.env.HQ_STAGE === 'test') {
    return;
  }
  for (const model of Object.values(models)) {
    for (const queryFunction of queryFunctions) {
      patchModel(model, queryFunction);
    }
  }
}

module.exports = {
  initSentry: initSentry
};