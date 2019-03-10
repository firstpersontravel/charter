// var _ = require('lodash');

var panelSubresource = require('./subresources').panel;

var LAYOUT_TYPE_OPTIONS = ['simple', 'tabs'];

var layout = {
  help: {
    summary: 'A layout is a combination of panels that create a user interface.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    type: { type: 'enum', options: LAYOUT_TYPE_OPTIONS, required: true },
    section: { type: 'string' },
    header_panels: {
      type: 'list',
      items: { type: 'subresource', class: panelSubresource }
    }
  },
  validateResource: function(script, resource) {
    if (!resource.type === 'tabs' && !resource.section) {
      return ['Tabs layout resource requires a section.'];
    }
  }
};

var content_page = {
  help: {
    summary: 'A content page is a section of static text or media that can be displayed by a user interface.'
  },
  properties: {
    name: { type: 'name', required: true },
    section: { type: 'string', required: true },
    title: { type: 'string', required: true },
    if: { type: 'ifClause' },
    panels: {
      type: 'list',
      required: true,
      items: { type: 'subresource', class: panelSubresource }
    }
  }
};

var page = {
  help: {
    summary: 'A page is a user interface that can be displayed to a player. It is comprised of panels, each of which is a unit of functionality.'
  },
  properties: {
    name: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true, parent: true },
    role: { type: 'reference', collection: 'roles', required: true, parent: true },
    title: { type: 'string', required: true },
    appearance: { type: 'reference', collection: 'appearances' },
    directive: { type: 'string' },
    layout: {
      type: 'reference',
      collection: 'layouts',
      allowNull: true,
      display: { hidden: true }
    },
    waypoint: { type: 'reference', collection: 'waypoints' },
    route: { type: 'reference', collection: 'routes' },
    panels: {
      type: 'list',
      default: [{}],
      items: { type: 'subresource', class: panelSubresource }
    }
  },
  validateResource: function(script, resource) {
    if (resource.route && resource.waypoint) {
      return ['Page resource cannot have both a route and a waypoint.'];
    }
  },
  getParentClaims: function(resource) {
    return resource.appearance ?
      ['appearances.' + resource.appearance] :
      ['roles.' + resource.role];
  },
  getChildClaims: function(resource) {
    // return _(resource.panels)
    //   .filter('cue')
    //   .map(function(panel) {
    //     return 'cues.' + panel.cue;
    //   })
    //   .value();
  }
};

module.exports = {
  content_page: content_page,
  page: page,
  layout: layout
};
