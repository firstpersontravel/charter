import type { ActionContext } from '../../types';
export default {
  title: 'Branch',
  help: 'A branch performs certain actions if an associated condition passes, and others if it does not.',
  display: { form: 'block' }, // override general action form: 'inline'
  params: {
    if: {
      type: 'component',
      component: 'conditions',
      help: 'The primary condition evaluated first.'
    },
    actions: {
      type: 'list',
      items: { type: 'component', component: 'actions' },
      help: 'Actions executed if the primary condition passes.'
    },
    elseifs: {
      type: 'list',
      help: 'A list of conditions and actions that are evaluated in order if the primary condition fails.',
      items: {
        type: 'object',
        properties: {
          if: {
            type: 'component',
            component: 'conditions',
            help: 'A condition to evaluate.'
          },
          actions: {
            type: 'list',
            help: 'Actions to execute if the condition of this Else If field passes.',
            items: {
              type: 'component',
              component: 'actions'
            }
          }
        }
      }
    },
    else: {
      type: 'list',
      items: { type: 'component', component: 'actions' },
      help: 'Actions executed if the primary condition and all Else If conditions fail.'
    }
  },
  // Stub, since conditionals are never executed -- instead they are
  // collapsed at trigger execute time.
  getOps(params: Record<string, any>, actionContext: ActionContext) {}
};

