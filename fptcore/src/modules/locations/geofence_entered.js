module.exports = {
  help: 'Occurs when a player enters a geofenced region.',
  parentParamNameOnEventSpec: 'geofence',
  specParams: {
    role: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role entering the geofence.'
    },
    geofence: {
      required: true,
      type: 'reference',
      collection: 'geofences',
      help: 'The geofence being entered.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  }
};
