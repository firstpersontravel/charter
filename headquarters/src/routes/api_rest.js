const _ = require('lodash');
const inflection = require('inflection');
const immutableUpdate = require('immutability-helper');
const Sequelize = require('sequelize');

const errors = require('../errors');

const LIST_COUNT_DEFAULT = 100;

/**
 * Add $auto for extending JSON objects
 */
immutableUpdate.extend('$auto', function(value, object) {
  return object ?
    immutableUpdate(object, value):
    immutableUpdate({}, value);
});

/**
 * Serialization / deserialization functions
 */
function serializeField(field, dataValue) {
  if (_.isUndefined(dataValue)) {
    return null;
  }
  return dataValue;
}

function serializeRecord(model, record) {
  return _(model.attributes)
    .keys()
    .sort()
    .map(key => ([
      key,
      serializeField(model.attributes[key], record.get(key, { plain: true }))
    ]))
    .fromPairs()
    .value();
}

/**
 * Scan the update and if any simple-form updates are present, i.e.
 * {parent: {value: 'new-value'}}, convert it to immutability-helper format,
 * i.e. {parent: {value: {$set: 'new-value'}}}.
 */
function convertToImmutableUpdate(object) {
  if (!_.isPlainObject(object)) {
    throw new errors.badRequestError('Invalid immutable update object.');
  }
  return _.mapValues(object, function(value, key) {
    // Commands are handled explicitly.
    if (key[0] === '$') {
      return value;
    }
    // If it's an object, continue recursion.
    if (_.isPlainObject(value)) {
      return convertToImmutableUpdate(value);
    }
    // Otherwise -- it's a string, number, boolean, or array, so we assume
    // this is an implicit $set command. So add it.
    return {$set: value};
  });
}

function deserializeField(field) {
  return field;
}

function deserializeFields(fields) {
  return _.mapValues(fields, function(value) {
    return deserializeField(value);
  });
}

function mergeFields(record, fields) {
  return _.mapValues(fields, function(value, key) {
    if (record[key] && _.isPlainObject(value)) {
      return immutableUpdate(record[key], convertToImmutableUpdate(value));
    } else {
      return value;
    }
  });
}

function respondWithRecord(res, model, record, status = 200) {
  const item = serializeRecord(model, record);
  const data = { [model.name.toLowerCase()]: item };
  res.status(status);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: data }, null, 2));
}

function respondWithRecords(res, model, records) {
  const modelNamePlural = inflection.pluralize(model.name.toLowerCase());
  const items = records.map(record => serializeRecord(model, record));
  const data = { [modelNamePlural]: items };
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({ data: data }, null, 2));
}

/**
 * Persistence functions
 */

async function updateRecord(record, fields) {
  record.set(fields);

  // Validate fields
  try {
    await record.validate();
  } catch (err) {
    if (err instanceof Sequelize.ValidationError) {
      // convert sequelize errs into api errors here
      const fieldNames = _.uniq(_.map(err.errors, 'path')).sort().join(', ');
      const message = `Invalid fields: ${fieldNames}.`;
      throw errors.validationError(message, {
        fields: err.errors.map(fieldErr => ({
          field: fieldErr.path,
          message: fieldErr.message
        }))
      });
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

function whereFromQuery(model, whereQuery) {
  return _.mapValues(whereQuery, (value, key) => {
    const attribute = model.attributes[key];
    if (!attribute) {
      throw errors.badRequestError(`Invalid query parameter: ${key}.`);
    }
    if (value === 'null') {
      return null;
    }
    const type = attribute.type || attribute;
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
    return value;
  });
}

function listCollectionRoute(model) {
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
    respondWithRecords(res, model, records);
  };
}

function createRecordRoute(model) {
  return async (req, res) => {
    const fields = deserializeFields(req.body);
    if (fields.id) {
      throw errors.badRequestError('Id is not allowed on create.');
    }
    const record = model.build();
    await updateRecord(record, fields);
    respondWithRecord(res, model, record, 201);
  };
}

function retrieveRecordRoute(model) {
  return async (req, res) => {
    const record = await loadRecord(model, req.params.recordId);
    respondWithRecord(res, model, record);
  };
}

function replaceRecordRoute(model) {
  return async (req, res) => {
    const record = await loadRecord(model, req.params.recordId);
    const fields = deserializeFields(req.body);
    await updateRecord(record, fields);
    respondWithRecord(res, model, record);
  };
}

function updateRecordRoute(model) {
  return async (req, res) => {
    const record = await loadRecord(model, req.params.recordId);
    const fields = mergeFields(record, deserializeFields(req.body));
    await updateRecord(record, fields);
    respondWithRecord(res, model, record);
  };
}

function deleteRecordRoute(model) {
  return async (req, res) => {
    const record = await loadRecord(model, req.params.recordId);
    const fields = deserializeFields(req.body);
    await updateRecord(record, fields);
    res.status(204);
  };
}

module.exports = {
  listCollectionRoute,
  createRecordRoute,
  retrieveRecordRoute,
  replaceRecordRoute,
  updateRecordRoute,
  deleteRecordRoute
};
