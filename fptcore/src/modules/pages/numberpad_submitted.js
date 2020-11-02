module.exports = {
  title: 'Number entry submitted',
  help: 'Occurs when a user confirms a number on a number entry.',
  parentComponentType: 'panels',
  parentComponentSpecProperty: 'numberpad',
  specParams: {
    numberpad: {
      title: 'Number entry',
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'numberpad',
      display: { label: false },
      help: 'The number entry that was submitted.'
    }
  },
  eventParams: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles'
    },
    numberpad_id: {
      title: 'Number entry',
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'numberpad',
      display: { label: false },
      help: 'The number entry that was submitted.'
    },
    submission: {
      required: true,
      type: 'string'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.numberpad === event.numberpad_id;
  },
  getTitle: function(scriptContent, resource, registry, walker) {
    if (!resource.numberpad) {
      return 'number entry submitted';
    }
    const numberpad = walker.getComponentById(scriptContent, 'panels',
      resource.numberpad);
    if (!numberpad) {
      return 'unknown number entry';
    }
    const numberpadTitle = numberpad.placeholder || '<number entry>';
    return `submitted to "${numberpadTitle}"`;
  }
};
