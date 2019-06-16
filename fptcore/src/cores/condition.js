const _ = require('lodash');

// TODO - just replace these with `_.get`?
const TemplateUtil = require('../utils/template');

const ifSpec = {};

const ifOpClasses = {
  istrue: {
    properties: {
      ref: {
        type: 'lookupable',
        required: true,
        display: { label: false }
      }
    },
    eval: function(params, evalContext) {
      return !!TemplateUtil.lookupRef(evalContext, params.ref);
    }
  },
  equals: {
    properties: {
      ref1: { type: 'lookupable', required: true },
      ref2: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      return (
        TemplateUtil.lookupRef(evalContext, params.ref1) ===
        TemplateUtil.lookupRef(evalContext, params.ref2)
      );
    }
  },
  contains: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      part_ref: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      const a = TemplateUtil.lookupRef(evalContext, params.string_ref);
      const b = TemplateUtil.lookupRef(evalContext, params.part_ref);
      return (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      );
    }
  },
  clip_answer_is: {
    properties: {
      response: { type: 'string', required: true, display: { label: false } }
    },
    eval: function(params, evalContext) {
      const msg = TemplateUtil.lookupRef(evalContext, 'event.response');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.response.toLowerCase()) > -1
      );
    }
  },
  text_contains: {
    properties: {
      part: { type: 'string', required: true, display: { label: false } }
    },
    eval: function(params, evalContext) {
      const msg = TemplateUtil.lookupRef(evalContext, 'event.message.content');
      return (
        typeof msg === 'string' &&
        msg.toLowerCase().indexOf(params.part.toLowerCase()) > -1
      );
    }
  },
  text_is_affirmative: {
    properties: {},
    eval: function(params, evalContext) {
      const msg = TemplateUtil.lookupRef(evalContext, 'event.message.content');
      const affirmativeParts = ['y', 'yes', 'sure', 'ok'];
      if (typeof msg !== 'string') {
        return false;
      }
      const lower = msg.toLowerCase();
      return _.some(affirmativeParts, part => lower.indexOf(part) > -1);
    }
  },
  matches: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      regex_ref: { type: 'string', required: true }
    },
    eval: function(params, evalContext) {
      const a = TemplateUtil.lookupRef(evalContext, params.string_ref);
      const regex = TemplateUtil.lookupRef(evalContext, params.regex_ref);
      return (
        typeof a === 'string' && RegExp(regex, 'i').test(a)
      );
    }
  },
  and: {
    properties: {
      items: {
        type: 'list',
        items: { type: 'ifClause' },
        display: { label: false }
      }
    },
    eval: function(params, evalContext) {
      return _.every(params.items, function(item) {
        return ConditionCore.if(evalContext, item);
      });
    }
  },
  or: {
    properties: {
      items: {
        type: 'list',
        items: { type: 'ifClause' },
        display: { label: false }
      }
    },
    eval: function(params, evalContext) {
      return _.some(params.items, function(item) {
        return ConditionCore.if(evalContext, item);
      });
    }
  },
  not: {
    properties: {
      item: {
        required: true,
        type: 'ifClause',
        display: { label: false }
      }
    },
    eval: function(params, evalContext) {
      if (!params.item) {
        return false;
      }
      return !ConditionCore.if(evalContext, params.item);
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
        display: { label: false }
      }
    }
  },
  classes: ifOpClasses
});

class ConditionCore {
  static if(evalContext, ifStatement) {
    // Null if statements resolve to true.
    if (!ifStatement) {
      return true;
    }
    const ifClass = ifOpClasses[ifStatement.op];
    if (!ifClass) {
      throw new Error('Invalid if operation: ' + ifStatement.op);
    }
    return ifClass.eval(ifStatement, evalContext);
  }
}

ConditionCore.ifSpec = ifSpec;
ConditionCore.ifOpClasses = ifOpClasses;

module.exports = ConditionCore;
