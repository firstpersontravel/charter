// From https://github.com/diosney/node-sequelize-noupdate-attributes/blob/master/lib/index.js
const Sequelize = require('sequelize');

module.exports = function (sequelize) {
  if (!sequelize) {
    throw new Error('The required sequelize instance option is missing');
  }

  sequelize.addHook('beforeValidate', function (instance, options) {
    if (!options.validate) {
      // return;
    }
    if (instance.isNewRecord) {
      return;
    }

    var changedKeys = [];

    Object
      .keys(instance._changed)
      .forEach(function (fieldName) {
        if (instance._changed[fieldName]) {
          changedKeys.push(fieldName);
        }
      });

    if (!changedKeys.length) {
      return;
    }

    var validationErrors = [];
    changedKeys.forEach(function (fieldName) {
      var fieldDefinition = instance.rawAttributes[fieldName];

      if (fieldDefinition.readOnly) {
        validationErrors.push(new Sequelize.ValidationErrorItem(fieldName + ' is readonly', 'readOnly Violation', fieldName, instance[fieldName]));
        return;
      }

      if (fieldDefinition.noUpdate &&
          instance._previousDataValues[fieldName] !== undefined &&
          instance._previousDataValues[fieldName] !== null) {
        validationErrors.push(new Sequelize.ValidationErrorItem(fieldName + 'cannot be updated', 'noUpdate Violation', fieldName, instance[fieldName]));
      }
    });

    if (validationErrors.length) {
      return Sequelize.Promise.try(function () {
        throw new Sequelize.ValidationError(null, validationErrors);
      });
    }
  });
};
