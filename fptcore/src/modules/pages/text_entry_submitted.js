module.exports = {
  help: 'Occurs when a user confirms text on a text entry field.',
  parentComponentType: 'panels',
  specParams: {
    text_entry: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'text_entry',
      display: { label: false },
      help: 'The text_entry that was submitted.'
    }
  },
  eventParams: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles'
    },
    text_entry_id: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'text_entry',
      display: { label: false },
      help: 'The text_entry that was submitted.'
    },
    submission: {
      required: true,
      type: 'string'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.text_entry === event.text_entry_id;
  },
  getTitle: function(scriptContent, resource, registry, walker) {
    if (!resource.text_entry) {
      return 'text_entry submitted';
    }
    const textEntry = walker.getComponentById(scriptContent, 'panels',
      resource.text_entry);
    if (!textEntry) {
      return 'unknown text_entry';
    }
    const textEntryTitle = textEntry.placeholder || '<no placeholder>';
    return `submitted to "${textEntryTitle}"`;
  }
};
