module.exports = {
  help: 'Occurs when a player enters a geofenced region.',
  parentParamNameOnEventSpec: 'geofence',
  specParams: {
    role: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    },
    geofence: { required: true, type: 'reference', collection: 'geofences' }
  },
  matchEvent: function(spec, event, actionContext) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  }
};
