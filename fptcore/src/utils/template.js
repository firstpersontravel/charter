const moment = require('moment-timezone');

const TimeUtil = require('./time');
const { get } = require('./lodash-replacements');

const refConstants = { true: true, false: false, null: null };
const templateRegex = /{{\s*([\w_\-.:]+)\s*}}/gi;
const ifElseRegex = /{%\s*if\s+(.+?)\s*%}(.*?)(?:{%\s*else\s*%}(.*?))?{%\s*endif\s*%}/gi;

class TemplateUtil {
  static lookupRef(evalContext, ref, roleName=null) {
    if (typeof ref === 'boolean' || ref === null || typeof ref === 'number') {
      return ref;
    }
    if (typeof ref !== 'string') {
      return null;
    }
    if (!isNaN(Number(ref))) {
      return Number(ref);
    }
    if (refConstants[ref] !== undefined) {
      return refConstants[ref];
    }
    if ((ref[0] === '"' && ref[ref.length - 1] === '"') ||
        (ref[0] === '\'' && ref[ref.length - 1] === '\'')) {
      return ref.slice(1, ref.length - 1);
    }
    // If ref is player, replace player. with first role state of that role.
    if (ref.startsWith('player.') && roleName) {
      ref = `roleStates.${roleName}[0].${ref.split('.')[1]}`;
    }
    const result = get(evalContext, ref);
    return result === undefined ? null : result;
  }

  static templateText(evalContext, text, timezone, roleName=null) {
    if (text === null || text === undefined) { return ''; }
    if (text === false) { return 'No'; }
    if (text === true) { return 'Yes'; }
    if (typeof text === 'number') { return text.toString(); }

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
      const val = this.lookupRef(evalContext, p1, roleName);
      return this.templateText(evalContext, val, timezone, roleName);
    });
    // Then {% if %} {% endif %} statements just look up a flag and test
    // if it is true: nothing more complicated
    text = text.replace(ifElseRegex, (m, p1, p2, p3) => {
      const val = this.lookupRef(evalContext, p1, roleName);
      return val ? p2 : (p3 || '');
    });
    return text;
  }
}

module.exports = TemplateUtil;
