const _ = require('lodash');

// TODO: rename audio collection to something that can be dumbly pluralized.
const plurals = {
  audio: 'audio',
  directions: 'directions',
  inbox: 'inboxes'
};

const singulars = {
  audio: 'audio',
  directions: 'directions',
  inboxes: 'inbox'
};

class TextUtil {
  static titleForSpec(spec, key) {
    if (spec.title) {
      return spec.title;
    }
    let simpleKey = key.replace('_name', '');
    if (spec.type === 'reference') {
      const resourceType = TextUtil.singularize(spec.collection);
      simpleKey = simpleKey.replace(`_${resourceType}`, '');
    }
    return this.titleForKey(simpleKey);
  }

  static titleForKey(key) {
    return key[0].toUpperCase() +
      key.toLowerCase().replace(/[_-]/g, ' ').substring(1);
  }

  static titleForTypedKey(key) {
    return this.titleForKey(key.split('-').slice(1).join('-'));
  }

  static formatPhone(text) {
    if (!text || text.length !== 10) {
      return text;
    }
    return '(' + text.substr(0, 3) + ') ' + text.substr(3, 3) + '-' +
      text.substr(6, 6);
  }

  static splitWords(sentence) {
    return _(sentence)
      .split('"')
      .map(function(v, i) {
        return i % 2 ? ['"' + v + '"'] : v.split(' ');
      })
      .flatten()
      .filter(Boolean)
      .value();
  }

  // Underscored var name for text - underscores and lowercase chars.
  static varForText(text) {
    if (!text) {
      return null;
    }
    return text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');
  }

  // Underscored var name for text - underscores and lowercase chars.
  static dashVarForText(text) {
    if (!text) {
      return null;
    }
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  // SUPER DUMB pluralization
  static pluralize(singular) {
    return plurals[singular] || (singular + 's');
  }

  // SUPER DUMB singularization
  static singularize(plural) {
    return singulars[plural] || plural.substr(0, plural.length - 1);
  }
}

module.exports = TextUtil;
