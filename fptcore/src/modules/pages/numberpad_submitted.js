module.exports = {
  help: 'Occurs when a user confirms a number on a numberpad.',
  // temp: show in side bar while working on preview
  // parentComponentType: 'panels',
  specParams: {
    numberpad: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'numberpad',
      display: { label: false },
      help: 'The numberpad that was submitted.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.numberpad === event.numberpad_id;
  },
  getTitle: function(scriptContent, resource, registry, walker) {
    if (!resource.numberpad) {
      return 'numberpad arrived';
    }
    const numberpad = walker.getComponentById(scriptContent, 'panels',
      resource.numberpad);
    if (!numberpad) {
      return 'unknown numberpad';
    }
    const numberpadTitle = numberpad.placeholder || '<numberpad>';
    return `submitted to "${numberpadTitle}"`;
  }
};
