const _ = require('lodash');

module.exports = {
  help: 'Occurs when an audio message has been received.',
  getTitle: function(scriptContent, spec) {
    const parts = ['audio'];
    if (spec.from) {
      const fromRole = _.find(scriptContent.roles, { name: spec.from });
      if (fromRole) {
        parts.push(fromRole.title);
      }
    }
    if (spec.to) {
      const toRole = _.find(scriptContent.roles, { name: spec.to });
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
  matchEvent: function(spec, event, actionContext) {
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
