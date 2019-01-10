module.exports = {
  geofence_entered: {
    parentResourceParam: 'geofence',
    specParams: {
      role: { required: true, type: 'reference', collection: 'roles' },
      geofence: { required: true, type: 'reference', collection: 'geofences' }
    },
    matchEvent: function(spec, event, actionContext) {
      return (
        spec.geofence === event.geofence &&
        spec.role === event.role
      );
    }
  }
};
