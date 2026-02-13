import type { ScriptContent } from '../../types';
export default {
  icon: 'envelope',
  help: 'An email account that you have access to. (This requires some custom setup.)',
  title: 'Email account',
  properties: {
    name: { type: 'name', required: true },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'Role this account belongs to.'
    },
    address: {
      type: 'enum',
      options: ['charter@firstperson.travel'],
      default: 'charter@firstperson.travel',
      required: true,
      help: 'Email address to send from. Currently must be charter@firstperson.travel.'
    }
  },
  getTitle: function(scriptContent: ScriptContent, spec: Record<string, any>) {
    return spec.address;
  }
};

