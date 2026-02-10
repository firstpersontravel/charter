module.exports = {
  help: 'Occurs when a button has been pressed.',
  parentComponentType: 'panels',
  parentComponentSpecProperty: 'button',
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
  matchEvent: function(spec: any, event: any, actionContext: any) {
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
    const btnTitle = registry.panels.button.getTitle(resource, button, 
      scriptContent);
    return `btn "${btnTitle}"`;
  }
};

export {};
