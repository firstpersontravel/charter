const _ = require('lodash');

const TimeUtil = require('./time');

const Validations = {
  address: {
    help: 'A geocodable address, including city, state and ZIP/postal code. For example: "111 Main Street, San Francisco CA 94110".',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param)) {
        return ['Address param "' + name + '" should be a string.'];
      }
      if (spec.required && param === '') {
        return ['Address param "' + name + '" should not be blank.'];
      }
    }
  },

  string: {
    title: 'Text',
    help: 'Arbitrary text, usually for display to a participant.',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param)) {
        return ['String param "' + name + '" should be a string.'];
      }
      if (spec.required && param === '') {
        return ['String param "' + name + '" should not be blank.'];
      }
    }
  },

  email: {
    help: 'An email address. For example, "agency@firstperson.travel".',
    validate: (scriptContent, name, spec, param) => {
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
  },

  markdown: {
    help: 'Text styled with markdown. See https://www.markdownguide.org/basic-syntax/ for help on how to use markdown.',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param)) {
        return ['Markdown param "' + name + '" should be a string.'];
      }
      if (spec.required && param === '') {
        return ['Markdown param "' + name + '" should not be blank.'];
      }
    }
  },

  simpleValue: {
    help: 'A field that can be a string, number, or "true" or "false".',
    title: 'Value',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param) && !_.isNumber(param) && !_.isBoolean(param)) {
        return [
          'Simple param "' + name + '" should be a string, number or boolean.'
        ];
      }
      if (spec.required && _.isString(param) && param === '') {
        return ['Simple param "' + name + '" should not be blank.'];
      }
    }
  },

  integer: {
    help: 'A simple integer value: 0, 100, -50, etc.',
    validate: (scriptContent, name, spec, param) => {
      if (!Number.isInteger(Number(param))) {
        return ['Integer param "' + name + '" should be a integer.'];
      }
    }
  },

  number: {
    help: 'An integer or number with a decimal.',
    validate: (scriptContent, name, spec, param) => {
      if (isNaN(Number(param))) {
        return ['Number param "' + name + '" should be a number.'];
      }
    }
  },

  boolean: {
    help: 'A simple true or false value.',
    validate: (scriptContent, name, spec, param) => {
      if (param !== true && param !== false) {
        return ['Boolean param "' + name + '" ("' + param + '") should be true or false.'];
      }
    }
  },

  enum: {
    help: 'A field allowing a choice between a limited set of values. The specific set of options will be different for each field and documented in that field.',
    title: 'Enumeration',
    validate: (scriptContent, name, spec, param) => {
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
  },

  timeOffset: {
    title: 'Duration',
    help: 'An offset of time indicated in a brief shorthand of number and unit. For instance, "10s" for ten seconds, "3.5h" for three and a half hours, or "-40m" for minus forty minutes. Negative offsets indicate a period prior to another time.',
    validate: (scriptContent, name, spec, param) => {
      if (!TimeUtil.timeOffsetRegex.test(param)) {
        return ['Time offset param "' + name + '" ("' + param + '") should be a number suffixed by "h/m/s".'];
      }
    }
  },

  name: {
    title: 'Reference',
    help: 'A reference to the name of an element in the script.',
    validate: (scriptContent, name, spec, param) => {
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
  },

  media: {
    help: 'Uploaded media: an image, video, or audio clip.',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param)) {
        return [`Media param "${name}" should be a string.`];
      }
      if (spec.required && !param) {
        return [`Media param "${name}" should not be blank.`];
      }
      if (param) {
        if (!param.startsWith('https://') &&
            !param.startsWith('http://') &&
            !/^\{\{[.\w_-]+\}\}$/.test(param)) {
          return [`Media param "${name}" must be a URL.`];
        }
      }
    }
  },

  coords: {
    help: 'Latitude/longitude coordinates.',
    validate: (scriptContent, name, spec, param) => {
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
  },

  timeShorthand: {
    help: 'A shorthand clock time, as defined in days relative to the start of the experience. For instance, `3:00pm` means 3pm the day of the experience. `5:30am` means 5:30am the day of the experience. `+1d 4:15pm` means 4:15pm the day after the day the experience started.',
    title: 'Time',
    validate: (scriptContent, name, spec, param) => {
      if (!TimeUtil.timeShorthandRegex.test(param)) {
        return [
          'Time shorthand param "' + name + '" ("' + param + '") must be valid.'
        ];
      }
    }
  },

  simpleAttribute: {
    help: 'A machine-readable name used for naming variables. Only letters, numbers, or underscores are allowed. For example, `date`, or `num_points` are valid variable names.',
    title: 'Variable name',
    validate: (scriptContent, name, spec, param) => {
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
  },

  lookupable: {
    help: 'A machine-readable name used for looking up variables. Only letters, numbers, dashes or underscores are allowed. For example, `date`, or `num_points`. Periods may be used to look up children of data dictionaries: for example, `inductee.link` or `current.directive`. Specific values can also be specified here by including the text in double quotes: the lookup `red` will look up the contents of the variable "red", whereas the lookup `"red"` will return the text value "red". Numbers like `1`, `400`, etc, can be used, as can the values `true` and `false`.',
    title: 'Lookup',
    validate: (scriptContent, name, spec, param) => {
      if (!_.isString(param)) {
        return ['Lookupable param "' + name + '" ("' + param + '") should be a string.'];
      }
      if (!param) {
        return ['Lookupable attribute param "' + name + '" should not be blank.'];
      }
      if ((/^"/.test(param)) && (!/^"[^"]+"$/.test(param))) {
        return ['Lookupable param "' + name + '" ("' + param + '") should only have quotes at the beginning and end.'];
      }
      if ((/^'/.test(param)) && (!/^'[^']+'$/.test(param))) {
        return ['Lookupable param "' + name + '" ("' + param + '") should only have quotes at the beginning and end.'];
      }
      if ((!/^['"]/.test(param)) && (!/^[\w\d_.-]+$/.test(param))) {
        return ['Lookupable param "' + name + '" ("' + param + '") should be alphanumeric with underscores, dashes and periods.'];
      }
    }
  }
};

module.exports = Validations;
