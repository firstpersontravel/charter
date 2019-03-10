var _ = require('lodash');

var geofence = {
  help: {
    summary: 'A geofence is a circular region around a waypoint. It can be used to trigger events when players enter or leave a region, or when messages are sent from within that region.'
  },
  properties: {
    name: { type: 'name', required: true },
    center: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true
    },
    distance: { type: 'number', required: true }
  },
  getTitle: function(scriptContent, resource) {
    var waypoint = _.find(scriptContent.waypoints, { name: resource.center });
    return resource.distance + 'm around ' + waypoint.title;
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.center];
  }
};

var ROUTE_VIA_OPTIONS = ['driving', 'walking', 'cycling'];

var route = {
  help: {
    summary: 'A route is a path between one waypoint and another.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    from: {
      type: 'reference',
      collection: 'waypoints',
      required: true,
      parent: true
    },
    to: {
      type: 'reference',
      collection: 'waypoints',
      required: true
    },
    via: { type: 'list', items: { type: 'coords' } },
    mode: { type: 'enum', options: ROUTE_VIA_OPTIONS, default: 'driving' }
  },
  getParentClaims: function(resource) {
    return ['waypoints.' + resource.from];
  }
};

var waypoint = {
  help: {
    summary: 'A waypoint defines a location used by the trip. Each waypoint has multiple options that can be set for each trip.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    options: {
      type: 'list',
      default: [{}],
      items: {
        type: 'object',
        properties: {
          name: { type: 'name', required: true },
          title: { type: 'string', required: true },
          coords: { type: 'coords', required: true },
          address: { type: 'string' },
          values: {
            type: 'dictionary',
            keys: { type: 'simpleAttribute' },
            values: { type: 'simpleValue' }
          }
        }
      }
    }
  }
};

module.exports = {
  geofence: geofence,
  route: route,
  waypoint: waypoint
};
