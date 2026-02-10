const components: Record<string, any> = {
  actions: {
    typeKey: 'name',
    propertiesKey: 'params',
    common: {
      display: { form: 'inline' },
      properties: {
        id: {
          type: 'integer',
          required: true,
          display: { hidden: true }
        }
      }
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
        id: {
          type: 'integer',
          required: true,
          display: { hidden: true }
        },
        visible_if: {
          type: 'component',
          component: 'conditions',
          help: 'A test to determine if this panel is visible. If this value is empty, the panel will always be visible.'
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

module.exports = components;

export {};
