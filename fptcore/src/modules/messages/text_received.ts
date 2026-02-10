import { find } from '../../utils/lodash-replacements';

module.exports = {
  help: 'Occurs when a text has been received.',
  getTitle: function(scriptContent: any, spec: any) {
    const parts = ['text'];
    if (spec.from) {
      const fromRole = find(scriptContent.roles, { name: spec.from });
      if (fromRole) {
        parts.push(fromRole.title);
      }
    }
    if (spec.to) {
      const toRole = find(scriptContent.roles, { name: spec.to });
      if (toRole) {
        parts.push('to ' + toRole.title);
      }
    }
    return parts.join(' ');
  },
  specParams: {
    from: {
      required: false,
      type: 'reference',
      collection: 'roles',
      help: 'The sender of the message.'
    },
    to: {
      required: false,
      type: 'reference',
      collection: 'roles',
      help: 'The recipient of the message.'
    }
  },
  matchEvent: function(spec: any, event: any, actionContext: any) {
    if (spec.from && spec.from !== event.from) {
      return false;
    }
    if (spec.to && spec.to !== event.to) {
      return false;
    }
    // Pass all that, the message matches
    return true;
  }
};
