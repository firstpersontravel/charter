var _ = require('lodash');
var moment = require('moment-timezone');

var TimeUtil = require('../utils/time');

var EvalCore = {};

// Assigned here to avoid infinite loop
EvalCore.ifSpec = {};

function negateIf(negated, result) {
  return negated ? !result : result;
}

EvalCore.IF_PARAM_OP_CLASSES = {
  istrue: {
    properties: {
      ref: { type: 'lookupable', required: true },
      neg: { type: 'boolean', default: false }
    },
    eval: function(params, evalContext) {
      return negateIf(params.neg, (
        !!EvalCore.lookupRef(evalContext, params.ref)
      ));
    }
  },
  equals: {
    properties: {
      ref1: { type: 'lookupable', required: true },
      ref2: { type: 'lookupable', required: true },
      neg: { type: 'boolean', default: false }
    },
    eval: function(params, evalContext) {
      return negateIf(params.neg, (
        EvalCore.lookupRef(evalContext, params.ref1) ===
        EvalCore.lookupRef(evalContext, params.ref2)
      ));
    }
  },
  contains: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      part_ref: { type: 'lookupable', required: true },
      neg: { type: 'boolean', default: false }
    },
    eval: function(params, evalContext) {
      var a = EvalCore.lookupRef(evalContext, params.string_ref);
      var b = EvalCore.lookupRef(evalContext, params.part_ref);
      return negateIf(params.neg, (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      ));
    }
  },
  matches: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      regex_ref: { type: 'string', required: true },
      neg: { type: 'boolean', default: false }
    },
    eval: function(params, evalContext) {
      var a = EvalCore.lookupRef(evalContext, params.string_ref);
      var regex = EvalCore.lookupRef(evalContext, params.regex_ref);
      return negateIf(params.neg, (
        typeof a === 'string' && RegExp(regex, 'i').test(a)
      ));
    }
  },
  and: {
    properties: { items: { type: 'list', items: EvalCore.ifSpec } },
    eval: function(params, evalContext) {
      return _.every(params.items, function(item) {
        return EvalCore.if(evalContext, item);
      });
    }
  },
  or: {
    properties: { items: { type: 'list', items: EvalCore.ifSpec } },
    eval: function(params, evalContext) {
      return _.some(params.items, function(item) {
        return EvalCore.if(evalContext, item);
      });
    }
  }
};

_.assign(EvalCore.ifSpec, {
  type: 'variegated',
  key: 'op',
  common: {
    properties: {
      op: {
        type: 'enum',
        options: Object.keys(EvalCore.IF_PARAM_OP_CLASSES),
        required: true,
        display: { primary: true }
      }
    }
  },
  classes: EvalCore.IF_PARAM_OP_CLASSES
});

EvalCore.if = function (evalContext, ifStatement) {
  var ifClass = EvalCore.IF_PARAM_OP_CLASSES[ifStatement.op];
  if (!ifClass) {
    throw new Error('Invalid if operation: ' + ifStatement.op);
  }
  return ifClass.eval(ifStatement, evalContext);
};

EvalCore.constants = { true: true, false: false, null: null };

EvalCore.lookupRef = function (evalContext, ref) {
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
  var result = _.get(evalContext, ref);
  return _.isUndefined(result) ? null : result;
};

EvalCore.templateRegex = /{{\s*([\w_\-.:]+)\s*}}/gi;
EvalCore.ifElseRegex = /{%\s*if\s+(.+?)\s*%}(.*?)(?:{%\s*else\s*%}(.*?))?{%\s*endif\s*%}/gi;

EvalCore.templateText = function (evalContext, text, timezone) {
  if (text === null || text === undefined) { return ''; }
  if (text === false) { return 'No'; }
  if (text === true) { return 'Yes'; }
  if (_.isNumber(text)) { return text.toString(); }

  // Is time
  if (TimeUtil.isoTimeRegex.test(text)) {
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
    return EvalCore.templateText(evalContext, EvalCore.lookupRef(evalContext, p1),
      timezone);
  });
  // Then {% if %} {% endif %} statements.
  text = text.replace(EvalCore.ifElseRegex, function(m, p1, p2, p3) {
    var ifStmt = { op: 'istrue', ref: p1 };
    return EvalCore.if(evalContext, ifStmt) ? p2 : (p3 || '');
  });
  return text;
};

module.exports = EvalCore;
