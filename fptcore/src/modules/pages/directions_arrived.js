module.exports = {
  help: 'Occurs when a user confirms arrival at a destination.',
  parentComponentType: 'panels',
  specParams: {
    directions: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'directions',
      display: { label: false },
      help: 'The directions that were completed.'
    }
  },
  eventParams: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles'
    },
    directions_id: {
      required: true,
      type: 'componentReference',
      componentType: 'panels',
      componentVariant: 'directions',
      display: { label: false },
      title: 'Directions',
      help: 'The directions that were completed.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return spec.directions === event.directions_id;
  },
  getTitle: function(scriptContent, resource, registry, walker) {
    if (!resource.directions) {
      return 'directions arrived';
    }
    const directions = walker.getComponentById(scriptContent, 'panels',
      resource.directions);
    if (!directions) {
      return 'unknown directions';
    }
    const directionsDest = directions.destination_name || '<no text>';
    return `arrived at "${directionsDest}"`;
  }
};
