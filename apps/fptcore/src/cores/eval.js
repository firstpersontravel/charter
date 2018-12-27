var _ = require('lodash');
var moment = require('moment-timezone');

var TextCore = require('./text');
var TimeCore = require('./time');

var EvalCore = {};

EvalCore.IF_COMMANDS = {
  istrue: function (a) { return !!a; },
  equals: function (a, b) { return a === b; },
  contains: function(a, b) {
    return (
      typeof a === 'string' &&
      typeof b === 'string' &&
      a.toLowerCase().indexOf(b.toLowerCase()) > -1
    );
  },
  matches: function(a, b) {
    return (
      typeof a === 'string' &&
      typeof b === 'string' &&
      RegExp(b, 'i').test(a)
    );
  }
};

EvalCore.simpleIf = function (context, ifStatement) {
  var ifParts = TextCore.splitWords(ifStatement);
  var isNegated = ifParts[0] === 'not';
  if (isNegated) {
    ifParts = ifParts.slice(1);
  }
  var ifCommand = ifParts.length > 1 ? ifParts[0] : 'istrue';
  var ifArgs = ifParts.length > 1 ? ifParts.slice(1) : ifParts;
  var ifValues = ifArgs.map(function(item) {
    return EvalCore.lookupRef(context, item);
  });
  var ifFunc = EvalCore.IF_COMMANDS[ifCommand];
  if (!ifFunc) {
    throw new Error('Invalid if command ' + ifCommand);
  }
  var isResult = ifFunc.apply(null, ifValues);
  var finalResult = isNegated ? !isResult : isResult;
  return finalResult;
};

EvalCore.if = function (context, ifStatement) {
  // If it's an array, join with AND
  if (_.isArray(ifStatement)) {
    return ifStatement.reduce(function(prev, ifItem) {
      return prev && EvalCore.if(context, ifItem);
    }, true);
  }

  // If it's an {or: [...array...]} object, join with OR
  if (_.isPlainObject(ifStatement) && ifStatement.or) {
    return ifStatement.or.reduce(function(prev, ifEl) {
      return prev || EvalCore.if(context, ifEl);
    }, false);
  }

  if (!_.isString(ifStatement)) {
    throw new Error('Illegal type for ifStatement ' + typeof ifStatement);
  }

  // Now it's one item.
  return EvalCore.simpleIf(context, ifStatement);
};

EvalCore.constants = { true: true, false: false, null: null };

EvalCore.lookupRef = function (context, ref) {
  if (_.isBoolean(ref) || _.isNull(ref) || _.isNumber(ref)) {
    return ref;
  }
  if (!_.isString(ref)) {
    return null;
  }
  if (!isNaN(Number(ref))) {
    return Number(ref);
  }
  if (!_.isUndefined(EvalCore.constants[ref])) {
    return EvalCore.constants[ref];
  }
  if ((ref[0] === '"' && ref[ref.length - 1] === '"') ||
      (ref[0] === '\'' && ref[ref.length - 1] === '\'')) {
    return ref.slice(1, ref.length - 1);
  }
  var result = _.get(context, ref);
  return _.isUndefined(result) ? null : result;
};

EvalCore.templateRegex = /{{\s*([\w_\-.:]+)\s*}}/gi;
EvalCore.ifElseRegex = /{%\s*if\s+(.+?)\s*%}(.*?)(?:{%\s*else\s*%}(.*?))?{%\s*endif\s*%}/gi;

EvalCore.templateText = function (context, text, timezone) {
  if (text === null || text === undefined) { return ''; }
  if (text === false) { return 'No'; }
  if (text === true) { return 'Yes'; }
  if (_.isNumber(text)) { return text.toString(); }

  // Is time
  if (TimeCore.isoTimeRegex.test(text)) {
    if (!timezone) {
      throw new Error('Timezone is required.');
    }
    return moment.utc(text).tz(timezone).format('h:mma');
  }

  // Is phone number
  if (/^\d{10}$/.test(text)) {
    return (
      '(' + text.substring(0, 3) + ') ' +
      text.substring(3, 6) + '-' +
      text.substring(6)
    );
  }

  // Interpolate {{ }}s first.
  text = text.replace(EvalCore.templateRegex, function(m, p1) {
    return EvalCore.templateText(context, EvalCore.lookupRef(context, p1),
      timezone);
  });
  // Then {% if %} {% endif %} statements.
  text = text.replace(EvalCore.ifElseRegex, function(m, p1, p2, p3) {
    return EvalCore.if(context, p1) ? p2 : (p3 || '');
  });
  return text;
};

module.exports = EvalCore;
