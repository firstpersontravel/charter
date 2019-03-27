module.exports = {
  help: { summary: 'Occurs when a player enters a geofenced region.' },
  parentResourceParam: 'geofence',
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
