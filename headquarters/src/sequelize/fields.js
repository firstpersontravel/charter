const _ = require('lodash');
const moment = require('moment');
const { INTEGER, DOUBLE, FLOAT, STRING, BOOLEAN, DATE, DATEONLY, TEXT } = require('sequelize');
const stringify = require('json-stable-stringify');

const { instrument } = require('../sentry');

function snakeCaseColumns(fieldValues) {
  return _.mapValues(fieldValues, function(value, key) {
    if (!_.isPlainObject(value)) {
      value = { type: value };
    }
    return _.assign(value, { field: _.snakeCase(key) });
  });
}

function mutableModifier(field) {
  if (field.foreignKey) {
    delete field.foreignKey.readOnly;
  } else {
    delete field.readOnly;
  }
  return field;
}

function allowNullModifier(field) {
  if (field.foreignKey) {
    field.foreignKey.allowNull = true;
    delete field.foreignKey.validate;
  } else {
    field.allowNull = true;
    delete field.validate.notNull;
  }
  return field;
}

function belongsToField(name) {
  const idField = name + 'Id';
  return {
    as: name,
    foreignKey: {
      name: idField,
      field: _.snakeCase(idField),
      allowNull: false,
      readOnly: true,
      validate: { notNull: { msg: 'must be present' } }
    }
  };
}

function integerField() {
  return {
    type: INTEGER,
    allowNull: false,
    readOnly: true,
    validate: { notNull: { msg: 'must be present' } }
  };
}

function requiredStringField(maxLength) {
  return stringField(maxLength, {
    notNull: { msg: 'must be present' }
  });
}

function optionalStringField(maxLength) {
  return stringField(maxLength);
}

function enumStringField(maxLength, values) {
  return stringField(maxLength, {
    notNull: { msg: 'must be present' },
    isIn: {
      args: [values],
      msg: `must be one of ${values.join(', ')}`
    }
  });
}

function stringField(maxLength, validate=null) {
  const validateWithLen = validate || {};
  validateWithLen.len = {
    args: [0, maxLength],
    msg: `must be less than ${maxLength} characters`
  };
  return {
    type: STRING,
    allowNull: false,
    readOnly: true,
    defaultValue: '',
    validate: validateWithLen
  };
}

function textField() {
  return {
    type: TEXT,
    allowNull: false,
    readOnly: true,
    defaultValue: '',
    validate: { notNull: { msg: 'must be present' } }
  };
}

function doubleField() {
  return {
    type: DOUBLE,
    allowNull: true,
    readOnly: true,
    validate: { isFloat: { msg: 'must be a valid number' } }
  };
}

function floatField() {
  return {
    type: FLOAT,
    allowNull: true,
    readOnly: true,
    validate: { isFloat: { msg: 'must be a valid number' } }
  };
}

function booleanField(defaultValue) {
  return {
    type: BOOLEAN,
    defaultValue: defaultValue,
    readOnly: true,
    validate: {
      isBoolean: function(value) {
        if (value !== true && value !== false) {
          throw new Error('must be true or false');
        }
      }
    }
  };
}

function datetimeField() {
  return {
    type: DATE,
    allowNull: false,
    readOnly: true,
    validate: { isDate: true, notNull: { msg: 'must be present' } }
  };
}

function dateField(fieldName) {
  return {
    type: DATEONLY,
    allowNull: false,
    readOnly: true,
    validate: {
      notNull: {
        msg: 'must be present'
      },
      isDate: function(value) {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !moment.utc(value, 'YYYY-MM-DD').isValid()) {
          throw new Error('must be a date in YYYY-MM-DD format');
        }
      }
    },
    get: function() {
      const dataValue = this.getDataValue(fieldName);
      if (_.isDate(dataValue)) {
        return moment
          .utc(this.getDataValue(fieldName), moment.ISO_8601)
          .format('YYYY-MM-DD');
      }
      return dataValue;
    },
    set: function(value) {
      this.setDataValue(fieldName, value);
    }
  };
}

const defaultJsonValidation = {
  notNull: {
    msg: 'must be present'
  },
  isObject: function(value) {
    if (!value) {
      return;
    }
    if (typeof value === 'string') {
      if (value[0] !== '{' && value !== '') {
        throw new Error('must be an object');
      }
    } else {
      if (!_.isObject(value)) {
        throw new Error(`must be an object, was ${typeof value}`);
      }
    }
  }
};

function jsonField(db, modelName, fieldName, options) {
  const self = this;
  options = options || {};

  process.nextTick(function() {
    function stringifyField(instance) {
      if (typeof instance.dataValues[fieldName] !== 'string' && instance.dataValues[fieldName]) {
        instrument('sequelize', `${modelName}#${fieldName}#stringify`, () => {
          instance.setDataValue(fieldName, JSON.stringify(instance.getDataValue(fieldName)));
        });
        return self;
      } else if (instance.dataValues[fieldName] === 'null' || !instance.dataValues[fieldName]) {
        instance.setDataValue(fieldName, {});
      }
    }
    if (typeof db.models === 'object' && db.models[modelName]) {
      db.models[modelName].addHook('beforeUpdate', stringifyField);
      db.models[modelName].addHook('beforeCreate', stringifyField);
    }
  });

  // Generate the model and return it.
  return {
    type: options.type || TEXT,
    allowNull: false,
    readOnly: true,
    get: function() {
      const currentValue = this.getDataValue(fieldName);
      if (currentValue === null || currentValue === '') {
        this.dataValues[fieldName] = {};
      } else if (typeof currentValue == 'string') {
        instrument('sequelize', `${modelName}#${fieldName}#parse`, () => {
          this.dataValues[fieldName] = JSON.parse(currentValue);
        });
      }
      return this.dataValues[fieldName];
    },
    set: function(value) {
      let str = value;
      if (value === null || value === undefined || value === '') {
        str = '{}';
      } else {
        instrument('sequelize', `${modelName}#${fieldName}#stringify`, () => {
          str = stringify(value, { space: 2 });
        });
      }
      this.setDataValue(fieldName, str);
    },
    validate: Object.assign({}, defaultJsonValidation, options.extraValidate),
    defaultValue: JSON.stringify(options.defaultValue || {})
  };
}

module.exports = {
  allowNullModifier,
  belongsToField,
  booleanField,
  dateField,
  datetimeField,
  doubleField,
  enumStringField,
  floatField,
  integerField,
  jsonField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns,
  stringField,
  textField
};
