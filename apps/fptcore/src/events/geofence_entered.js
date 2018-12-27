module.exports = {
  specParams: {
    role: { required: true, type: 'resource', collection: 'roles' },
    geofence: { required: true, type: 'resource', collection: 'geofences' }
  },
  matchEvent: function(script, context, spec, event) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  }
};
