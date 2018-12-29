var _ = require('lodash');

var TextUtil = {};

TextUtil.titleForKey = function (key) {
  return key[0].toUpperCase() +
    key.toLowerCase().replace(/[_-]/g, ' ').substring(1);
};

TextUtil.titleForTypedKey = function (key) {
  return TextUtil.titleForKey(key.split('-').slice(1).join('-'));
};

TextUtil.formatPhone = function(text) {
  if (!text || text.length !== 10) {
    return text;
  }
  return '(' + text.substr(0, 3) + ') ' + text.substr(3, 3) + '-' +
    text.substr(6, 6);
};

TextUtil.splitWords = function(sentence) {
  return _(sentence)
    .split('"')
    .map(function(v, i) {
      return i % 2 ? ['"' + v + '"'] : v.split(' ');
    })
    .flatten()
    .filter(Boolean)
    .value();
};

module.exports = TextUtil;
