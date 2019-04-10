var panels = require('./panels');

var panelSubresources = {};

Object.keys(panels).forEach(function(panelType) {
  panelSubresources[panelType + '_panel'] = {
    subresource: panels[panelType]
  };
});

module.exports = {
  name: 'pages',
  resources: Object.assign({
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
      }
    },
    panel: {
      subresource: require('./panel')
    }
  }, panelSubresources),
};
