const _ = require('lodash');
const moment = require('moment-timezone');

const TimeUtil = require('../utils/time');

const ifSpec = {};

const ifOpClasses = {
  istrue: {
    properties: {
      ref: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      return !!EvalCore.lookupRef(evalContext, params.ref);
    }
  },
  equals: {
    properties: {
      ref1: { type: 'lookupable', required: true },
      ref2: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      return (
        EvalCore.lookupRef(evalContext, params.ref1) ===
        EvalCore.lookupRef(evalContext, params.ref2)
      );
    }
  },
  contains: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      part_ref: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      const a = EvalCore.lookupRef(evalContext, params.string_ref);
      const b = EvalCore.lookupRef(evalContext, params.part_ref);
      return (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      );
    }
  },
  matches: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      regex_ref: { type: 'string', required: true }
    },
    eval: function(params, evalContext) {
      const a = EvalCore.lookupRef(evalContext, params.string_ref);
      const regex = EvalCore.lookupRef(evalContext, params.regex_ref);
      return (
        typeof a === 'string' && RegExp(regex, 'i').test(a)
      );
    }
  },
  and: {
    properties: { items: { type: 'list', items: { type: 'ifClause' } } },
    eval: function(params, evalContext) {
      return _.every(params.items, function(item) {
        return EvalCore.if(evalContext, item);
      });
    }
  },
  or: {
    properties: { items: { type: 'list', items: { type: 'ifClause' } } },
    eval: function(params, evalContext) {
      return _.some(params.items, function(item) {
        return EvalCore.if(evalContext, item);
      });
    }
  },
  not: {
    properties: {
      item: {
        required: true,
        type: 'ifClause',
        display: { primary: true }
      }
    },
    eval: function(params, evalContext) {
      if (!params.item) {
        return false;
      }
      return !EvalCore.if(evalContext, params.item);
    }
  },
};

_.assign(ifSpec, {
  type: 'variegated',
  key: 'op',
  common: {
    properties: {
      op: {
        type: 'enum',
        options: Object.keys(ifOpClasses),
        required: true,
        display: { primary: true }
      }
    }
  },
  classes: ifOpClasses
});


const refConstants = { true: true, false: false, null: null };
const templateRegex = /{{\s*([\w_\-.:]+)\s*}}/gi;
const ifElseRegex = /{%\s*if\s+(.+?)\s*%}(.*?)(?:{%\s*else\s*%}(.*?))?{%\s*endif\s*%}/gi;


class EvalCore {
  static if(evalContext, ifStatement) {
    const ifClass = ifOpClasses[ifStatement.op];
    if (!ifClass) {
      throw new Error('Invalid if operation: ' + ifStatement.op);
    }
    return ifClass.eval(ifStatement, evalContext);
  }

  static lookupRef(evalContext, ref) {
    if (_.isBoolean(ref) || _.isNull(ref) || _.isNumber(ref)) {
      return ref;
    }
    if (!_.isString(ref)) {
      return null;
    }
    if (!isNaN(Number(ref))) {
      return Number(ref);
    }
    if (!_.isUndefined(refConstants[ref])) {
      return refConstants[ref];
    }
    if ((ref[0] === '"' && ref[ref.length - 1] === '"') ||
        (ref[0] === '\'' && ref[ref.length - 1] === '\'')) {
      return ref.slice(1, ref.length - 1);
    }
    const result = _.get(evalContext, ref);
    return _.isUndefined(result) ? null : result;
  }

  static templateText(evalContext, text, timezone) {
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
    text = text.replace(templateRegex, (m, p1) => {
      return this.templateText(evalContext, this.lookupRef(evalContext, p1),
        timezone);
    });
    // Then {% if %} {% endif %} statements.
    text = text.replace(ifElseRegex, (m, p1, p2, p3) => {
      const ifStmt = { op: 'istrue', ref: p1 };
      return this.if(evalContext, ifStmt) ? p2 : (p3 || '');
    });
    return text;
  }
}

EvalCore.ifSpec = ifSpec;
EvalCore.ifOpClasses = ifOpClasses;

module.exports = EvalCore;
