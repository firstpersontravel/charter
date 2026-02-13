export default {
  migrations: {
    scriptContent: function(scriptContent) {
      delete scriptContent.qr_codes;
    },
    interfaces: function(iface: any) {
      delete iface.header_panels;
    },
    pages: function(page) {
      if (page.panels) {
        page.panels = page.panels.filter(p => p.type !== 'qr_display');
      }
    },
    content_pages: function(cp) {
      if (cp.panels) {
        cp.panels = cp.panels.filter(p => p.type !== 'qr_display');
      }
    }
  },
  tests: [{
    before: {
      qr_codes: [{}],
      pages: [{
        panels: [{ type: 'qr_display' }, { type: 'other' }]
      }],
      content_pages: [{
        panels: [{ type: 'button' }, { type: 'qr_display' }]
      }]
    },
    after: {
      pages: [{
        panels: [{ type: 'other' }]
      }],
      content_pages: [{
        panels: [{ type: 'button' }]
      }]
    }
  }]
};
