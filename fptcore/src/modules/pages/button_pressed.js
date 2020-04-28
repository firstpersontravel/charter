module.exports = {
  help: 'Occurs when a button has been pressed.',
  parentComponentType: 'panels',
  specParams: {
    button: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'button',
      display: { label: false },
      help: 'The button that was pressed.'
    }
  },
  eventParams: {
    button_id: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'button',
      display: { label: false },
      title: 'Button',
      help: 'The button that was pressed.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.button === event.button_id;
  },
  getTitle: function(scriptContent, resource, registry, walker) {
    if (!resource.button) {
      return 'btn';
    }
    const button = walker.getComponentById(scriptContent, 'panels',
      resource.button);
    if (!button) {
      return 'unknown btn';
    }
    const buttonText = button.text || '<no text>';
    return `btn "${buttonText}"`;
  }
};
