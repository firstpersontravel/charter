// var ActionsRegistry = require('../../registries/actions');
// var EventsRegistry = require('../../registries/events');

var action = {

};

var event = {
  type: 'variegated',
  key: function(obj) { return Object.keys(obj)[0]; }
};

var trigger = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    event: {
      type: 'list',
      items: { type: 'subresource', class: event },
      required: true
    },
    repeatable: { type: 'boolean', default: true },
    if: { type: 'ifClause' },
    actions: {
      type: 'list',
      items: { type: 'subresource', class: action },
      required: true
    },
  }
};

module.exports = {
  trigger: trigger
};
