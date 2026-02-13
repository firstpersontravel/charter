const panels = require('./panels').default;

export default {
  name: 'pages',
  resources: {
    content_page: {
      resource: require('./content_page').default
    },
    interface: {
      resource: require('./interface').default,
      actions: {
        update_interface: require('./interface_update').default,
      },
    },
    page: {
      resource: require('./page').default,
      actions: {
        send_to_page: require('./page_send_to').default
      },
      events: {
        button_pressed: require('./button_pressed').default,
        numberpad_submitted: require('./numberpad_submitted').default,
        directions_arrived: require('./directions_arrived').default,
        text_entry_submitted: require('./text_entry_submitted').default
      },
      panels: panels,
      conditions: require('./panel_conditions').default
    }
  },
};

