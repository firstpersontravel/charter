function newTab(contentPage) {
  const tab = {
    title: contentPage.title,
    panels: contentPage.panels
  };
  if (contentPage.active_if) {
    tab.visible_if = contentPage.active_if;
  }
  return tab;
}
export default {
  migrations: {
    interfaces: function(iface, scriptContent) {
      // Move content pages into tab interfaces
      if (iface.type === 'tabs' && scriptContent.content_pages) {
        const tabs = scriptContent.content_pages.filter(cp => (
          cp.interface === iface.name &&
          cp.section === iface.section
        ));
        for (const tab of tabs) {
          scriptContent.content_pages = scriptContent.content_pages
            .filter(cp => cp.name !== tab.name);
        }
        iface.tabs = tabs.map(t => (newTab(t)));
      }
      delete iface.type;
      delete iface.section;
    },
  },
  tests: [{
    before: {
      interfaces: [{
        type: 'tabs',
        section: 'tab'
      }],
      content_pages: [{
        name: '1',
        title: 'Other content',
        section: 'other',
        panels: [{ type: 'directions' }]
      }, {
        name: '2',
        title: 'Main tab',
        section: 'tab',
        panels: [{ type: 'button' }, { type: 'qr_display' }]
      }]
    },
    after: {
      interfaces: [{
        tabs: [{
          title: 'Main tab',
          panels: [{ type: 'button' }, { type: 'qr_display' }]
        }]
      }],
      content_pages: [{
        name: '1',
        title: 'Other content',
        section: 'other',
        panels: [{ type: 'directions' }]
      }]
    }
  }]
};
