// Todo: make this safer
function newResourceId() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

module.exports = {
  actions: {
    typeKey: 'name',
    propertiesKey: 'params',
    common: {
      display: { form: 'inline' },
      properties: {
        id: {
          type: 'integer',
          required: true,
          default: () => newResourceId(),
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
          default: () => newResourceId(),
          display: { hidden: true }
        },
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
