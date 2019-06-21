const _ = require('lodash');

const TimeUtil = require('./time');

class Validations {
  static string(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['String param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['String param "' + name + '" should not be blank.'];
    }
  }

  static email(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Email param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['Email param "' + name + '" should not be blank.'];
    }
    const emailRegex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+\.[^>]+)>?)/;
    if (!emailRegex.test(param)) {
      return ['Email param "' + name + '" should be a valid email.'];
    }
  }

  static markdown(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Markdown param "' + name + '" should be a string.'];
    }
    if (spec.required && param === '') {
      return ['Markdown param "' + name + '" should not be blank.'];
    }
  }

  static simpleValue(script, name, spec, param) {
    if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
      return [
        'Simple param "' + name + '" should be a string, number or boolean.'
      ];
    }
    if (spec.required && _.isString(param) && param === '') {
      return ['Simple param "' + name + '" should not be blank.'];
    }
  }

  static number(script, name, spec, param) {
    if (isNaN(Number(param))) {
      return ['Number param "' + name + '" should be a number.'];
    }
  }

  static boolean(script, name, spec, param) {
    if (param !== true && param !== false) {
      return ['Boolean param "' + name + '" ("' + param + '") should be true or false.'];
    }
  }

  static enum(script, name, spec, param) {
    if (!spec.options) {
      throw new Error('Invalid enum spec: missing options.');
    }
    if (!_.includes(spec.options, param)) {
      return [
        'Enum param "' + name + '" is not one of ' +
        spec.options.map(function(s) { return '"' + s + '"'; }).join(', ') + '.'
      ];
    }
  }

  static timeOffset(script, name, spec, param) {
    if (!TimeUtil.timeOffsetRegex.test(param)) {
      return ['Time offset param "' + name + '" ("' + param + '") should be a number suffixed by "h/m/s".'];
    }
  }

  static name(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Name param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!/[a-zA-Z]/.test(param[0])) {
      return ['Name param "' + name + '" ("' + param + '") should start with a letter.'];
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
      return ['Name param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
    }
  }

  static media(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Media param "' + name + '" should be a string.'];
    }
    if (spec.required && !param) {
      return ['Media param "' + name + '" should not be blank.'];
    }
    // TODO: validate URL or media path
    if (spec.extensions) {
      const matchesExtension = _.some(spec.extensions, function(ext) {
        return _.endsWith(param, '.' + ext);
      });
      if (!matchesExtension) {
        return ['Media param "' + name + '" should have one of the following extensions: ' + spec.extensions.join(', ') + '.'];
      }
    }
  }

  static coords(script, name, spec, param) {
    if (!_.isArray(param) || param.length !== 2 ||
        isNaN(Number(param[0])) || isNaN(Number(param[1]))) {
      return ['Coords param "' + name + '" should be an array of two numbers.'];
    }
    if (param[0] < -180 || param[0] > 180) {
      return ['Coords param "' + name + '[0]" should be between -180 and 180.'];
    }
    if (param[1] < -180 || param[1] > 180) {
      return ['Coords param "' + name + '[1]" should be between -180 and 180.'];
    }
  }

  static timeShorthand(script, name, spec, param) {
    if (!TimeUtil.timeShorthandRegex.test(param)) {
      return [
        'Time shorthand param "' + name + '" ("' + param + '") must be valid.'
      ];
    }
  }

  static simpleAttribute(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Simple attribute param "' + name + '" should be a string.'];
    }
    if (!param) {
      return ['Simple attribute param "' + name + '" should not be blank.'];
    }
    if (!/[A-Za-z]/.test(param[0])) {
      return ['Simple attribute param "' + name + '" ("' + param + '") should start with a letter.'];
    }
    if (!/^[\w\d_]*$/.test(param)) {
      return ['Simple attribute param "' + name + '" ("' + param + '") should be alphanumeric with underscores.'];
    }
  }

  static lookupable(script, name, spec, param) {
    if (!_.isString(param)) {
      return ['Lookupable param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!param) {
      return ['Lookupable attribute param "' + name + '" should not be blank.'];
    }
    if (!/^['"]?[\w\d_.-]+['"]?$/.test(param)) {
      return ['Lookupable param "' + name + '" ("' + param + '") should be alphanumeric with underscores, dashes and periods.'];
    }
  }

  static reference(script, name, spec, param) {
    if (param === 'null' && spec.allowNull) {
      return [];
    }
    if (!_.isString(param)) {
      return ['Reference param "' + name + '" ("' + param + '") should be a string.'];
    }
    if (!param) {
      return ['Reference attribute param "' + name + '" should not be blank.'];
    }
    if (!/[a-zA-Z]/.test(param[0])) {
      return ['Reference param "' + name + '" ("' + param + '") should start with a letter.'];
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
      return ['Reference param "' + name + '" ("' + param + '") should be alphanumeric with dashes or underscores.'];
    }
    const collectionName = spec.collection;
    const resourceNames = _.map(script.content[collectionName] || [], 'name');
    if (!_.includes(resourceNames, param)) {
      return ['Reference param "' + name + '" ("' + param + '") ' +
        'is not in collection "' + collectionName + '".'];
    }
  }
}

module.exports = Validations;
