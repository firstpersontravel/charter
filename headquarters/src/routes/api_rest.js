const _ = require('lodash');
const inflection = require('inflection');
const Sequelize = require('sequelize');

const errors = require('../errors');

const LIST_COUNT_DEFAULT = 100;

/**
 * Serialization / deserialization functions
 */
function serializeField(field, dataValue) {
  if (_.isUndefined(dataValue)) {
    return null;
  }
  return dataValue;
}

function serializeRecord(model, record, opts) {
  return _(model.attributes)
    .keys()
    .filter(key => !_.includes(opts.blacklistFields, key))
    .sort()
    .map(key => ([
      key,
      serializeField(model.attributes[key], record.get(key, { plain: true }))
    ]))
    .fromPairs()
    .value();
}

function deserializeField(field) {
  return field;
}

function deserializeFields(model, fields, opts) {
  return _.mapValues(fields, function(value, key) {
    if (!model.attributes[key] || _.includes(opts.blacklistFields, key)) {
      throw errors.validationError(`Invalid field: "${key}".`);
    }
    return deserializeField(value);
  });
}

function mergeFields(record, fields) {
  return _.mapValues(fields, function(value, key) {
    if (_.isPlainObject(record[key]) && _.isPlainObject(value)) {
      // Shallow merge of records only
      return Object.assign({}, record[key], value);
    } else {
      return value;
    }
  });
}

function respondWithRecord(res, model, record, opts, status = 200) {
  const item = serializeRecord(model, record, opts);
  const data = { [model.name.toLowerCase()]: item };
  res.status(status);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: data }, null, 2));
}

function respondWithRecords(res, model, records, opts) {
  const modelNamePlural = inflection.pluralize(model.name.toLowerCase());
  const items = records.map(record => serializeRecord(model, record, opts));
  const data = { [modelNamePlural]: items };
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: data }, null, 2));
}

/**
 * Persistence functions
 */

// Convert sequelize errs into api errors here.
function apiErrorFromValidationError(err) {
  const fieldNames = _.uniq(_.map(err.errors, 'path')).sort().join(', ');
  const fields = [];
  const message = `Invalid fields: ${fieldNames}.`;
  for (const fieldErr of err.errors) {
    // Check for *NESTED* validation errors and unpack those -- this is most
    // likely from the script schema validation.
    if (fieldErr.path === 'content' &&
        fieldErr.__raw &&
        fieldErr.__raw.errors) {
      fields.push.apply(fields, fieldErr.__raw.errors.map(rawErr => ({
        field: fieldErr.path,
        path: rawErr.path,
        message: rawErr.message
      })));
      continue;
    }
    // Otherwise just a normal error.
    fields.push({
      field: fieldErr.path,
      message: fieldErr.message
    });
  }
  return errors.validationError(message, { fields: fields });
}

async function updateRecord(record, fields) {
  record.set(fields);

  // Validate fields
  try {
    await record.validate();
  } catch (err) {
    if (err instanceof Sequelize.ValidationError) {
      throw apiErrorFromValidationError(err);
    } else {
      throw err;
    }
  }
  // If we're updating, only save supplied fields.
  const isCreating = record.id === null;
  const saveOpts = isCreating ? {} : { fields: Object.keys(fields) };

  // Save fields
  try {
    await record.save(saveOpts);
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      throw errors.validationError('Invalid foreign key.', {});      
    } else {
      throw errors.internalError(err.message, {});
    }
  }
}

async function loadRecord(model, recordId) {
  if (isNaN(Number(recordId))) {
    throw errors.badRequestError('Invalid record id.');
  }
  const record = await model.findById(Number(recordId));
  if (!record) {
    throw errors.notFoundError('Record not found.');
  }
  return record;
}

/**
 * Route factory functions
 */

function orderFromParam(model, sortQueryParam) {
  if (!sortQueryParam) {
    return [['id', 'ASC']];
  }
  const isDescending = sortQueryParam[0] === '-';
  const paramName = sortQueryParam.substring(isDescending ? 1 : 0);
  if (!model.attributes[paramName]) {
    throw errors.badRequestError(`Invalid sort parameter: ${paramName}.`);
  }
  return [[paramName, isDescending ? 'DESC' : 'ASC']];
}

function _validateValue(type, key, value) {
  try {
    type.validate(value);
  } catch (err) {
    if (err instanceof Sequelize.ValidationError) {
      throw errors.badRequestError(
        `Invalid value "${value}" for parameter ${key}.`
      );
    } else {
      throw err;
    }
  }
}

function whereValueFromQuery(model, key, value) {
  const attribute = model.attributes[key];
  if (!attribute) {
    throw errors.badRequestError(`Invalid query parameter: ${key}.`);
  }
  if (value === 'null') {
    return null;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  const type = attribute.type || attribute;
  if (_.isString(value) && value.indexOf(',') > -1) {
    value = value.split(',');
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      _validateValue(type, key, item);
    }
    return { [Sequelize.Op.or]: value };
  }
  _validateValue(type, key, value);
  return value;
}

function whereFromQuery(model, whereQuery) {
  return _.mapValues(whereQuery, (value, key) => (
    whereValueFromQuery(model, key, value)
  ));
}

function listCollectionRoute(model, authz, opts={}) {
  return async (req, res) => {
    const offset = Number(req.query.offset || 0);
    const count = Number(req.query.count || LIST_COUNT_DEFAULT);
    const order = orderFromParam(model, req.query.sort);
    const whereQuery = _.omit(req.query, ['sort', 'count', 'offset']);
    const where = whereFromQuery(model, whereQuery);
    const records = await model.findAll({
      offset: offset,
      limit: count,
      order: order,
      where: where
    });
    for (const record of records) {
      authz.checkRecord(req, 'retrieve', model, record);
    }
    respondWithRecords(res, model, records, opts);
  };
}

function createRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    authz.checkRecord(req, 'create', model, null);
    authz.checkFields(req, 'create', model, null, req.body);
    const fields = deserializeFields(model, req.body, opts);
    if (fields.id) {
      throw errors.badRequestError('Id is not allowed on create.');
    }
    const record = model.build();
    await updateRecord(record, fields);
    respondWithRecord(res, model, record, opts, 201);
  };
}

function retrieveRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    authz.checkRecord(req, 'retrieve', model, record);
    respondWithRecord(res, model, record, opts);
  };
}

function replaceRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    authz.checkRecord(req, 'update', model, record);
    authz.checkFields(req, 'update', model, record, req.body);
    const fields = deserializeFields(model, req.body, opts);
    await updateRecord(record, fields);
    respondWithRecord(res, model, record, opts);
  };
}

function updateRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    authz.checkRecord(req, 'update', model, record);
    authz.checkFields(req, 'update', model, record, req.body);
    const fields = deserializeFields(model, req.body, opts);
    const mergedFields = mergeFields(record, fields);
    await updateRecord(record, mergedFields);
    respondWithRecord(res, model, record, opts);
  };
}

module.exports = {
  listCollectionRoute,
  createRecordRoute,
  retrieveRecordRoute,
  replaceRecordRoute,
  updateRecordRoute
};
