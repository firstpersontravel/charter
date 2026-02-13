import type { ActionContext, Event } from '../../types';
export default {
  help: 'Occurs when Charter receives a call initiated by a user.',
  specParams: {
    from: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player who initiated the call.'
    },
    to: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player receiving the call.'
    }
  },
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    return spec.from === event.from && spec.to === event.to;
  }
};

