module.exports = {
  actions: {
    typeKey: 'name',
    propertiesKey: 'params',
    common: {
      display: { form: 'inline' }
    }
  },
  events: {
    typeKey: 'type',
    propertiesKey: 'specParams',
    common: {
      display: { form: 'inline' }
    }
  },
  panels: {
    typeKey: 'type',
    propertiesKey: 'properties',
    common: {
      properties: {
        visible_if: {
          type: 'component',
          component: 'conditions',
          help: 'A test to determine if this panel is visible.'
        }
      }
    }
  },
  conditions: {
    typeKey: 'op',
    propertiesKey: 'properties',
    common: {
      display: { form: 'inline' }
    }
  }
};
