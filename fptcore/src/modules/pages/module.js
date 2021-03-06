var panels = require('./panels');

module.exports = {
  name: 'pages',
  resources: {
    content_page: {
      resource: require('./content_page')
    },
    interface: {
      resource: require('./interface'),
      actions: {
        update_interface: require('./interface_update'),
      },
    },
    page: {
      resource: require('./page'),
      actions: {
        send_to_page: require('./page_send_to')
      },
      events: {
        button_pressed: require('./button_pressed'),
        numberpad_submitted: require('./numberpad_submitted'),
        directions_arrived: require('./directions_arrived'),
        text_entry_submitted: require('./text_entry_submitted')
      },
      panels: panels,
      conditions: require('./panel_conditions')
    }
  },
};
