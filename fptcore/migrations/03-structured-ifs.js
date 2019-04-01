var _ = require('lodash');

var ifCommandArgNames = {
  istrue: ['ref'],
  equals: ['ref1', 'ref2'],
  contains: ['string_ref', 'part_ref'],
  matches: ['string_ref', 'regex_ref']
};

function parseParens(str) {
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
}

function breakWordList(words, breakBy) {
  var broken = [[]];
  _.each(words, function(word) {
    if (word === breakBy) {
      broken.push([]);
    } else {
      broken[broken.length - 1].push(word);
    }
  });
  return broken;
}

function xformWords(words) {
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
  var argNames = ifCommandArgNames[ifCommand];
  if (!argNames) {
    throw new Error('Invalid if command ' + ifCommand + '.');
  }
  var ifArgs = words.length > 1 ? words.slice(1) : words;
  var argsByName = _(argNames)
    .map(function(argName, i) { return [argName, ifArgs[i]]; })
    .fromPairs()
    .value();
  var op = _.assign({ op: ifCommand }, argsByName);
  if (isNegated) {
    return { op: 'not', item: op };
  }
  return op;
}

function isStringOrList(i) {
  return _.isString(i) || _.isArray(i);
}

function xformNestedWords(wordsOrLists) {
  if (!_.isArray(wordsOrLists)) {
    throw new Error('Expected array.');
  }
  if (!_.every(wordsOrLists, isStringOrList)) {
    throw new Error('Expected array of strings or lists.');
  }
  // Blank is false
  if (wordsOrLists.length === 0) {
    return null;
  }
  // If only one entry, just evaluate it.
  if (wordsOrLists.length === 1 && _.isArray(wordsOrLists[0])) {
    return xformNestedWords(wordsOrLists[0]);
  }

  // Break by ors first.
  var hasOr = _.some(wordsOrLists, function(i) { return i === 'or'; });
  if (hasOr) {
    var brokenByOr = breakWordList(wordsOrLists, 'or');
    var resultsToOr = _.map(brokenByOr, function(part) {
      return xformNestedWords(part);
    });
    return { op: 'or', items: resultsToOr };
  }

  // Then ands.
  var hasAnd = _.some(wordsOrLists, function(i) { return i === 'and'; });
  if (hasAnd) {
    var brokenByAnd = breakWordList(wordsOrLists, 'and');
    var resultsToAnd = _.map(brokenByAnd, function(part) {
      return xformNestedWords(part);
    });
    return { op: 'and', items: resultsToAnd };
  }
  
  // We should be left with just some plain words. If there are any lists left,
  // we don't know how to parse them.
  var hasLists = _.some(wordsOrLists, _.isArray);
  if (hasLists) {
    throw new Error('Lists must be joined by "or" or "and".');
  }

  // Parse words.
  return xformWords(wordsOrLists);
}

module.exports = {
  migrations: {
    ifClauses: function(ifClause, scriptContent, parent, key) {
      if (!ifClause) {
        return;
      }
      var nestedWords = parseParens(ifClause);
      parent[key] = xformNestedWords(nestedWords);
    }
  },
  tests: [{
    before: {
      triggers: [{
        if: '(not a and b)'
      }, {
        if: '((equals abc_def ghi_jkl and contains x "y") or not zzz)'
      }]
    },
    after: {
      triggers: [{
        if: {
          op: 'and',
          items: [{
            op: 'not',
            item: {
              op: 'istrue',
              ref: 'a'
            }
          }, {
            op: 'istrue',
            ref: 'b'
          }]
        }
      }, {
        if: {
          op: 'or',
          items: [{
            op: 'and',
            items: [{
              op: 'equals',
              ref1: 'abc_def',
              ref2: 'ghi_jkl'
            }, {
              op: 'contains',
              string_ref: 'x',
              part_ref: '"y"'
            }]
          }, {
            op: 'not',
            item: {
              op: 'istrue',
              ref: 'zzz'
            }
          }]
        }
      }]
    }
  }]
};
