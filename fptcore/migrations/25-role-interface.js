module.exports = {
  migrations: {
    scriptContent: function(scriptContent) {
      scriptContent.interfaces = scriptContent.layouts;
      delete scriptContent.layouts;
      delete scriptContent.appearances;
    },
    variants: function(variant) {
      delete variant.starting_pages;
    },
    roles: function(role) {
      role.interface = role.layout;
      delete role.layout;
    },
    content_pages: function(contentPage, scriptContent) {
      const firstInterface = (scriptContent.interfaces || [])[0];
      contentPage.interface = firstInterface.name;
    },
    pages: function(page, scriptContent) {
      const role = scriptContent.roles.find(r => r.name === page.role);
      if (!role.interface) {
        if (!scriptContent.interfaces) {
          scriptContent.interfaces = [];
        }
        scriptContent.interfaces.push({
          name: role.name,
          type: 'simple',
          title: role.title
        });
        role.interface = role.name;
      }
      page.interface = role.interface;
      delete page.role;
      delete page.appearance;
      delete page.layout;
    }
  },
  tests: [{
    before: {
      layouts: [{ name: 'phone' }],
      roles: [{
        name: 'Player',
        layout: 'phone'
      }, {
        name: 'Other',
        title: 'Other'
      }],
      content_pages: [{}],
      pages: [{
        role: 'Player',
        field: 1
      }, {
        role: 'Other',
        field: 2
      }]
    },
    after: {
      interfaces: [{
        name: 'phone'
      }, {
        name: 'Other',
        type: 'simple',
        title: 'Other'
      }],
      roles: [{
        name: 'Player',
        interface: 'phone'
      }, {
        name: 'Other',
        title: 'Other',
        interface: 'Other'
      }],
      content_pages: [{ interface: 'phone' }],
      pages: [{
        interface: 'phone',
        field: 1
      }, {
        interface: 'Other',
        field: 2
      }]
    }
  }]
};
