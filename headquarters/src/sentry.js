const Sentry = require('@sentry/node');

const config = require('./config');

function instrument(op, desc, fn) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction();
  const span = transaction && transaction.startChild({ op: op, description: desc });
  try {
    return fn();
  } catch (err) {
    span && span.setHttpStatus(500);
    throw err;
  } finally {
    span && span.setHttpStatus(200);
    span && span.finish();
  }
}

async function instrumentAsync(op, desc, fn) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction();
  const span = transaction && transaction.startChild({ op: op, description: desc });
  try {
    return await fn();
  } catch (err) {
    span && span.setHttpStatus(500);
    throw err;
  } finally {
    span && span.setHttpStatus(200);
    span && span.finish();
  }
}

// Instrument query functions
const modelFunctions = [
  'findByPk',
  'findOne',
  'findAll',
  'create',
  'update',
  'destroy'
];

const instanceFunctions = [
  'update',
  'save'
];

async function patchedTxn(obj, txn, txnName, args) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction();
  // If no transaction, just call
  if (!transaction) {
    return await txn.call(obj, ...args);
  }
  return await instrumentAsync('sequelize', txnName, () => txn.call(obj, ...args));
}

function modelTxn(model, txn, txnName) {
  return async (...args) => patchedTxn(model, txn, txnName, args);
}

function instanceTxn(txn, txnName) {
  return async function(...args) {
    return await patchedTxn(this, txn, txnName, args);
  };
}

function patchModel(model) {
  for (const fn of modelFunctions) {
    const patchedName = `__${fn}`;
    model[patchedName] = model[fn];
    model[fn] = modelTxn(model, model[patchedName], `${model.name}.${fn}`);
  }
  for (const fn of instanceFunctions) {
    const patchedName = `__${fn}`;
    model.prototype[patchedName] = model.prototype[fn];
    model.prototype[fn] = instanceTxn(model.prototype[patchedName], `${model.name}#${fn}`);
  }
}

function initTracing(models) {
  if (config.env.HQ_STAGE === 'test') {
    return;
  }
  for (const model of Object.values(models)) {
    patchModel(model);
  }
}


module.exports = {
  initTracing: initTracing,
  instrument: instrument,
  instrumentAsync: instrumentAsync
};