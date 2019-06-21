var panels = require('./panels');

module.exports = {
  name: 'pages',
  resources: {
    content_page: {
      resource: require('./content_page')
    },
    layout: {
      resource: require('./layout')
    },
    page: {
      resource: require('./page'),
      actions: {
        adjust_page: require('./page_adjust'),
        send_to_page: require('./page_send_to')
      },
      panels: panels
    }
  },
};
