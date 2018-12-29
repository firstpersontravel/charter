var _ = require('lodash');
var moment = require('moment');
var { DOUBLE, FLOAT, STRING, BOOLEAN, DATE, DATEONLY, TEXT } = require('sequelize');
var stringify = require('json-stable-stringify');

function snakeCaseColumns(fieldValues) {
  return _.mapValues(fieldValues, function(value, key) {
    if (!_.isPlainObject(value)) {
      value = { type: value };
    }
    return _.assign(value, { field: _.snakeCase(key) });
  });
}

function belongsTo(name, allowNull=false) {
  var idField = name + 'Id';
  return {
    as: name,
    foreignKey: {
      name: idField,
      field: _.snakeCase(idField),
      allowNull: allowNull,
      validate: allowNull ? {} : { notNull: { msg: 'must be present' } }
    }
  };
}

function hasMany(as, targetName, allowNull=false) {
  var targetIdField = targetName + 'Id';
  return {
    as: as,
    foreignKey: {
      name: targetIdField,
      field: _.snakeCase(targetIdField),
      allowNull: allowNull,
      validate: allowNull ? {} : { notNull: { msg: 'must be present' } }
    }
  };
}

function oneToMany(HasId, RelatedTo, allowNull=false) {
  const hasIdName = HasId.name.toLowerCase();
  const relatedToName = RelatedTo.name.toLowerCase();
  HasId.belongsTo(RelatedTo, belongsTo(relatedToName, allowNull));
  RelatedTo.hasMany(HasId, hasMany(hasIdName, relatedToName, allowNull));
}

function requiredStringField(maxLength, validate=null) {
  return stringField(maxLength, Object.assign(validate || {}, {
    notNull: { msg: 'must be present' }
  }));
}

function optionalStringField(maxLength, validate=null) {
  return stringField(maxLength, validate);
}

function enumStringField(maxLength, values, msg) {
  return stringField(maxLength, {
    notNull: { msg: 'must be present' },
    isIn: {
      args: [values],
      msg: msg || `must be one of ${values.join(', ')}`
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
    defaultValue: '',
    validate: validateWithLen
  };
}

function textField(validate) {
  return {
    type: TEXT,
    allowNull: false,
    defaultValue: '',
    validate: validate
  };
}

function doubleField() {
  return {
    type: DOUBLE,
    allowNull: true,
    validate: { isFloat: { msg: 'must be a valid number' } }
  };
}

function floatField() {
  return {
    type: FLOAT,
    allowNull: true,
    validate: { isFloat: { msg: 'must be a valid number' } }
  };
}

function booleanField(defaultValue) {
  return {
    type: BOOLEAN,
    defaultValue: defaultValue,
    validate: {
      isBoolean: function(value) {
        if (value !== true && value !== false) {
          throw new Error('must be true or false');
        }
      }
    }
  };
}

function datetimeField(allowNull=true) {
  const validate = { isDate: true };
  if (!allowNull) {
    validate.notNull = { msg: 'must be present' };
  }
  return {
    type: DATE,
    allowNull: allowNull,
    validate: validate
  };
}

function dateField(fieldName) {
  return {
    type: DATEONLY,
    allowNull: false,
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
      var dataValue = this.getDataValue(fieldName);
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
      if (value[0] !== '{') {
        throw new Error('must be an object');
      }
    } else {
      if (!_.isObject(value)) {
        throw new Error('must be an object');
      }
    }
  }
};

function jsonField(db, modelName, fieldName, options) {
  var self = this;
  options = options || {};

  process.nextTick(function() {
    function stringifyField(instance) {
      if (typeof instance.dataValues[fieldName] !== 'string' && instance.dataValues[fieldName]) {
        instance.setDataValue(fieldName, JSON.stringify(instance.getDataValue(fieldName)));
        return self;
      } else if (instance.dataValues[fieldName] === 'null' || !instance.dataValues[fieldName]) {
        instance.setDataValue(fieldName, undefined);
      }
    }
    if (typeof db.models === 'object' && db.models.hasOwnProperty(modelName) && typeof db.models[modelName].hook === 'function') {
      db.models[modelName].hook('beforeUpdate', stringifyField);
      db.models[modelName].hook('beforeCreate', stringifyField);
    }
  });

  // Generate the model and return it.
  return {
    type: options.type || TEXT,
    allowNull: false,
    get: function() {
      var currentValue = this.getDataValue(fieldName);
      if (currentValue === '') {
        this.dataValues[fieldName] = {};
      } else if (typeof currentValue == 'string') {
        this.dataValues[fieldName] = JSON.parse(currentValue);
      }
      return this.dataValues[fieldName];
    },
    set: function(value) {
      this.setDataValue(fieldName, stringify(value, {space: 2}));
    },
    validate: Object.assign({}, defaultJsonValidation, options.extraValidate),
    defaultValue: JSON.stringify(options.defaultValue || {})
  };
}

module.exports = {
  belongsTo,
  booleanField,
  dateField,
  datetimeField,
  doubleField,
  enumStringField,
  snakeCaseColumns,
  floatField,
  hasMany,
  jsonField,
  oneToMany,
  optionalStringField,
  requiredStringField,
  stringField,
  textField
};
