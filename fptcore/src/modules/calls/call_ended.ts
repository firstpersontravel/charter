import type { ActionContext, Event } from '../../types';

module.exports = {
  help: 'Occurs when a player hangs up the phone.',
  specParams: {
    role: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'Any of the players involved in the call.'
    }
  },
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    return (event.roles as string[]).includes(spec.role);
  }
};

export {};
