var _ = require('lodash');
var moment = require('moment-timezone');

var TextUtil = require('../utils/text');
var TimeUtil = require('../utils/time');

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

EvalCore.parseParens = function(str) {
  var i = 0;
  var quoted = false;
  var trailingWhiteSpace = str[str.length - 1] === ' ';
  function parenClause() {
    var arr = [];
    var startIndex = i;
    function addWord() {
      if (i - 1 > startIndex) {
        arr.push(str.slice(startIndex, i - 1));
      }
    }
    while (i < str.length) {
      var c = str[i++];
      if (c === '"') {
        quoted = !quoted;
      }
      if (quoted) {
        continue;
      }
      switch(c) {
      case ' ':
        addWord();
        startIndex = i;
        continue;
      case '(':
        arr.push(parenClause());
        startIndex = i;
        continue;
      case ')':
        addWord();
        return arr;
      }
    }
    if (!trailingWhiteSpace) {
      i = i + 1;
      addWord();
    }
    return arr;
  }
  return parenClause();
};

EvalCore.breakWordList = function(words, breakBy) {
  var broken = [[]];
  _.each(words, function(word) {
    if (word === breakBy) {
      broken.push([]);
    } else {
      broken[broken.length - 1].push(word);
    }
  });
  return broken;
};

EvalCore.evalWords = function(evalContext, words) {
  if (!_.isArray(words)) {
    throw new Error('Expected array.');
  }
  if (!_.every(words, _.isString)) {
    throw new Error('Expected array of strings.');
  }
  var isNegated = words[0] === 'not';
  if (isNegated) {
    words = words.slice(1);
  }
  var ifCommand = words.length > 1 ? words[0] : 'istrue';
  var ifArgs = words.length > 1 ? words.slice(1) : words;
  var ifValues = ifArgs.map(function(item) {
    return EvalCore.lookupRef(evalContext, item);
  });
  var ifFunc = EvalCore.IF_COMMANDS[ifCommand];
  if (!ifFunc) {
    throw new Error('Invalid if command ' + ifCommand + '.');
  }
  var isResult = ifFunc.apply(null, ifValues);
  var finalResult = isNegated ? !isResult : isResult;
  return finalResult;
};

function isStringOrList(i) {
  return _.isString(i) || _.isArray(i);
}

EvalCore.evalNestedWords = function(evalContext, wordsOrLists) {
  if (!_.isArray(wordsOrLists)) {
    throw new Error('Expected array.');
  }
  if (!_.every(wordsOrLists, isStringOrList)) {
    throw new Error('Expected array of strings or lists.');
  }
  // Blank is false
  if (wordsOrLists.length === 0) {
    return false;
  }
  // If only one entry, just evaluate it.
  if (wordsOrLists.length === 1 && _.isArray(wordsOrLists[0])) {
    return EvalCore.evalNestedWords(evalContext, wordsOrLists[0]);
  }

  // Break by ors first.
  var hasOr = _.some(wordsOrLists, function(i) { return i === 'or'; });
  if (hasOr) {
    var brokenByOr = EvalCore.breakWordList(wordsOrLists, 'or');
    var resultsToOr = _.map(brokenByOr, function(part) {
      return EvalCore.evalNestedWords(evalContext, part);
    });
    return _.some(resultsToOr);
  }

  // Then ands.
  var hasAnd = _.some(wordsOrLists, function(i) { return i === 'and'; });
  if (hasAnd) {
    var brokenByAnd = EvalCore.breakWordList(wordsOrLists, 'and');
    var resultsToAnd = _.map(brokenByAnd, function(part) {
      return EvalCore.evalNestedWords(evalContext, part);
    });
    return _.every(resultsToAnd);
  }
  
  // We should be left with just some plain words. If there are any lists left,
  // we don't know how to parse them.
  var hasLists = _.some(wordsOrLists, _.isArray);
  if (hasLists) {
    throw new Error('Lists must be joined by "or" or "and".');
  }

  // Parse words.
  return EvalCore.evalWords(evalContext, wordsOrLists);
};

EvalCore.simpleIf = function (evalContext, ifStatement) {
  var ifParts = TextUtil.splitWords(ifStatement);
  return EvalCore.evalWords(evalContext, ifParts);
};

EvalCore.if = function (evalContext, ifStatement) {
  var nestedWords = EvalCore.parseParens(ifStatement);
  return EvalCore.evalNestedWords(evalContext, nestedWords);
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
    return EvalCore.if(evalContext, p1) ? p2 : (p3 || '');
  });
  return text;
};

module.exports = EvalCore;
