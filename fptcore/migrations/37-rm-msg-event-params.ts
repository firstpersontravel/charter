let counter = 110000;

module.exports = {
  migrations: {
    triggers: function(trigger) {
      if (!trigger.event) {
        return;
      }
      if (trigger.event.type === 'text_received' ||
          trigger.event.type === 'image_received' ||
          trigger.event.type === 'audio_received') {
        if (trigger.event.contains !== undefined) {
          if (trigger.event.type === 'text_received' &&
              trigger.event.contains) {
            trigger.actions = [{
              id: counter,
              name: 'conditional',
              if: { op: 'text_contains', part: trigger.event.contains },
              actions: trigger.actions
            }];
            counter += 1;
          }
          delete trigger.event.contains;
        }
        if (trigger.event.geofence !== undefined) {
          trigger.actions = [{
            id: counter,
            name: 'conditional',
            if: {
              op: 'role_in_geofence',
              role: trigger.event.from,
              geofence: trigger.event.geofence
            },
            actions: trigger.actions
          }];
          delete trigger.event.geofence;
          counter += 1;
        }
      }
    }
  },
  tests: [{
    before: {
      triggers: [{
        event: { type: 'text_received', contains: '123' },
        actions: [{ name: 'first' }]
      }, {
        event: { type: 'text_received', from: 'player', geofence: 'geoname' },
        actions: [{ name: 'second' }]
      }]
    },
    after: {
      triggers: [{
        event: { type: 'text_received' },
        actions: [{
          id: 110000,
          name: 'conditional',
          if: { op: 'text_contains', part: '123' },
          actions: [{ name: 'first' }]
        }]
      }, {
        event: { type: 'text_received', from: 'player' },
        actions: [{
          id: 110001,
          name: 'conditional',
          if: { op: 'role_in_geofence', role: 'player', geofence: 'geoname' },
          actions: [{ name: 'second' }]
        }]
      }]
    }
  }]
};
