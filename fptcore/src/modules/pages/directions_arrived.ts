import type { ActionContext, Event } from '../../types';
export default {
  help: 'Occurs when a user confirms arrival at a destination.',
  parentComponentType: 'panels',
  parentComponentSpecProperty: 'directions',
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
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
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
    if (directions.route) {
      const route = scriptContent.routes
        .find(r => r.name === directions.route);
      return `arrived along "${route.title}"`;
    }
    if (directions.waypoint) {
      const waypoint = scriptContent.waypoints
        .find(r => r.name === directions.waypoint);
      return `arrived at "${waypoint.title}"`;
    }
    return `arrived at ${directions.destination_name || 'unknown dest'}`;
  }
};

