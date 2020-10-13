const _ = require('lodash');
const moment = require('moment');
const inflection = require('inflection');
const Sequelize = require('sequelize');

const config = require('../config');
const errors = require('../errors');

const logger = config.logger.child({ name: 'routes.api_rest' });

const LIST_COUNT_DEFAULT = 250;

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

const globalReadonlyFields = ['createdAt', 'updatedAt'];

function deserializeFields(model, fields, opts) {
  return _.mapValues(fields, function(value, key) {
    if (!model.attributes[key] ||
        _.includes(opts.blacklistFields, key) ||
        _.includes(globalReadonlyFields, key)) {
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

async function updateRecord(model, record, fields) {
  record.set(fields);

  const updateFields = Object.keys(fields);

  // Add timestamps.
  const now = moment.utc();
  if (record.isNewRecord && model.attributes.createdAt) {
    record.createdAt = now;
    updateFields.push('createdAt');
  }
  if (model.attributes.updatedAt) {
    record.updatedAt = now;
    updateFields.push('updatedAt');
  }

  // Validate fields. Note that this will catch errors in both updated fields
  // *AND* existing fields in the DB that are un-modified by this operation.
  // Meaning if some field in a database record is invalid, *ANY* updates to
  // that record, even to unrelated fields, will fail with a 400. It really
  // should be a 500 if it's an existing data integrity issue.
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
  const saveOpts = isCreating ? {} : { fields: updateFields };

  // Save fields
  try {
    await record.save(saveOpts);
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      throw errors.validationError('Invalid foreign key.', {});      
    } else {
      logger.error(err.stack);
      throw errors.internalError(err.message, {});
    }
  }
}

async function loadRecord(model, recordId) {
  if (isNaN(Number(recordId))) {
    throw errors.badRequestError('Invalid record id.');
  }
  const record = await model.findByPk(Number(recordId));
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
  // DATEONLY field has no validate
  if (!type.validate) {
    return;
  }
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

const queryOpTable = {
  eq: Sequelize.Op.eq,
  gt: Sequelize.Op.gt,
  gte: Sequelize.Op.gte,
  lt: Sequelize.Op.lt,
  lte: Sequelize.Op.lte
};

const valConstants = {
  null: null,
  true: true,
  false: false
};

function whereValueFromQuery(model, fieldName, operator, value) {
  const attribute = model.attributes[fieldName];
  if (!attribute) {
    throw errors.badRequestError(`Invalid query field: "${fieldName}".`);
  }
  const sqlOp = queryOpTable[operator];
  if (!sqlOp) {
    throw errors.badRequestError(`Invalid query operator: "${operator}".`);
  }

  let normalizedValue = value;
  if (!_.isUndefined(valConstants[value])) {
    normalizedValue = valConstants[value];
  } else if (_.isString(value) && value.indexOf(',') > -1) {
    normalizedValue = value.split(',');
  }

  const type = attribute.type || attribute;
  if (Array.isArray(normalizedValue)) {
    for (const item of normalizedValue) {
      _validateValue(type, fieldName, item);
    }
    return { [Sequelize.Op.in]: normalizedValue };
  }

  if (normalizedValue !== null) {
    _validateValue(type, fieldName, normalizedValue);
  }
  return { [sqlOp]: normalizedValue };
}

function whereFromQuery(model, whereQuery, opts) {
  _.each(opts.requireFilters, (filter) => {
    if (_.isFunction(filter)) {
      filter(whereQuery);
      return;
    }
    if (_.isUndefined(whereQuery[filter])) {
      throw errors.badRequestError(`Missing required filter: "${filter}".`);
    }
  });
  return _(whereQuery)
    .map((value, key) => {
      const parts = key.split('__');
      const fieldName = parts[0];
      const op = parts.length > 1 ? parts[1] : 'eq';
      const normalizedValue = whereValueFromQuery(model, fieldName, op, value);
      return [fieldName, normalizedValue];
    })
    .groupBy(fieldAndOpsByField => fieldAndOpsByField[0])
    .map((fieldAndOps, fieldName) => {
      const ops = fieldAndOps.map(i => i[1]);
      const combined = ops.length === 1 ? ops[0] : { [Sequelize.Op.and]: ops };
      return [fieldName, combined];
    })
    .fromPairs()
    .value();
}

function listCollectionRoute(model, authz, opts={}) {
  return async (req, res) => {
    res.loggingOrgId = req.query.orgId ? Number(req.query.orgId) : null;
    const offset = Number(req.query.offset || 0);
    const count = Number(req.query.count || LIST_COUNT_DEFAULT);
    const order = orderFromParam(model, req.query.sort);
    const whereQuery = _.omit(req.query, ['sort', 'count', 'offset']);
    authz.checkRecord(req, 'list', model, whereQuery);
    const where = whereFromQuery(model, whereQuery, opts);
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
    const fields = deserializeFields(model, req.body, opts);
    if (fields.id) {
      throw errors.badRequestError('Id is not allowed on create.');
    }
    const record = model.build(fields);
    res.loggingOrgId = record.orgId ? Number(record.orgId) : null;
    authz.checkRecord(req, 'create', model, record);
    authz.checkFields(req, 'create', model, record, req.body);
    await updateRecord(model, record, fields);
    respondWithRecord(res, model, record, opts, 201);
  };
}

function retrieveRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    res.loggingOrgId = record.orgId ? Number(record.orgId) : null;
    authz.checkRecord(req, 'retrieve', model, record);
    respondWithRecord(res, model, record, opts);
  };
}

function replaceRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    res.loggingOrgId = record.orgId ? Number(record.orgId) : null;
    authz.checkRecord(req, 'update', model, record);
    authz.checkFields(req, 'update', model, record, req.body);
    const fields = deserializeFields(model, req.body, opts);
    await updateRecord(model, record, fields);
    respondWithRecord(res, model, record, opts);
  };
}

function replaceRecordsRoute(model, authz, opts={}) {
  return async (req, res) => {
    res.loggingOrgId = req.query.orgId ? Number(req.query.orgId) : null;
    const where = whereFromQuery(model, req.query, opts);
    const records = await model.findAll({ where: where });
    const fields = deserializeFields(model, req.body, opts);
    for (const record of records) {
      authz.checkRecord(req, 'update', model, record);
      authz.checkFields(req, 'update', model, record, req.body);
      await updateRecord(model, record, fields);
    }
    respondWithRecords(res, model, records, opts);
  };
}

function updateRecordRoute(model, authz, opts={}) {
  return async (req, res) => {
    const recordId = req.params.recordId;
    const record = await loadRecord(model, recordId);
    res.loggingOrgId = record.orgId ? Number(record.orgId) : null;
    authz.checkRecord(req, 'update', model, record);
    authz.checkFields(req, 'update', model, record, req.body);
    const fields = deserializeFields(model, req.body, opts);
    const mergedFields = mergeFields(record, fields);
    await updateRecord(model, record, mergedFields);
    respondWithRecord(res, model, record, opts);
  };
}

function updateRecordsRoute(model, authz, opts={}) {
  return async (req, res) => {
    res.loggingOrgId = req.query.orgId ? Number(req.query.orgId) : null;
    const where = whereFromQuery(model, req.query, opts);
    const records = await model.findAll({ where: where });
    const fields = deserializeFields(model, req.body, opts);
    for (const record of records) {
      authz.checkRecord(req, 'update', model, record);
      authz.checkFields(req, 'update', model, record, req.body);
      const mergedFields = mergeFields(record, fields);
      await updateRecord(model, record, mergedFields);
    }
    respondWithRecords(res, model, records, opts);
  };
}

module.exports = {
  createRecordRoute,
  listCollectionRoute,
  replaceRecordRoute,
  replaceRecordsRoute,
  retrieveRecordRoute,
  updateRecordRoute,
  updateRecordsRoute
};
