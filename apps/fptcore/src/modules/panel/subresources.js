var PANEL_BUTTON_STYLE_OPTIONS = ['solo'];
var PANEL_IMAGE_STYLE_OPTIONS = ['float-right'];
var PANEL_TEXT_STYLE_OPTIONS = ['centered', 'quest'];

var PANEL_COMMON_CLASS = {
  properties: {
    type: { type: 'string', required: true },
    if: { type: 'ifClause' }
  }
};

var PANEL_CLASSES = {
  audio_foreground: {
    properties: {
      path: { type: 'media' }
    }
  },
  button: {
    properties: {
      text: { type: 'string', required: true },
      cue: { type: 'reference', collection: 'cues', required: true },
      style: { type: 'enum', options: PANEL_BUTTON_STYLE_OPTIONS }
    }
  },
  choice: {
    properties: {
      text: { type: 'string', required: true },
      value_ref: { type: 'simpleAttribute', required: true },
      choices: {
        type: 'list',
        required: true,
        items: {
          type: 'subresource',
          class: {
            properties: {
              value: { type: 'string', required: true },
              text: { type: 'string', required: true }
            }
          }
        }
      }
    }
  },
  content_browse: {
    properties: {
      title: { type: 'string', required: true },
      section: { type: 'string', required: true }
    }
  },
  directions: {
    properties: {
      route: { type: 'reference', collection: 'routes' },
      waypoint: { type: 'reference', collection: 'waypoints' },
      geofence: { type: 'reference', collection: 'geofences' },
      cue: { type: 'reference', collection: 'cues' },
      destination_name: { type: 'string' }
    },
    validateResource: function(script, resource) {
      if (!resource.route && !resource.waypoint) {
        return ['Directions panel requires either a route or a waypoint.'];
      }
    }
  },
  image: {
    properties: {
      path: { type: 'media', required: true },
      style: { type: 'enum', options: PANEL_IMAGE_STYLE_OPTIONS }
    }
  },
  messages_browse: {
    properties: {
      title: { type: 'string', required: true }
    }
  },
  messages: {
    properties: {
      title: { type: 'string' },
      as: { type: 'reference', collection: 'roles', required: true },
      with: { type: 'reference', collection: 'roles', required: true }
    }
  },
  numberpad: {
    properties: {
      submit: { type: 'string' },
      placeholder: { type: 'string' },
      unknown: { type: 'string' },
      correct_ref: { type: 'simpleAttribute', required: true },
      cue: { type: 'reference', collection: 'cues', required: true }
    }
  },
  outlet: {
    properties: {
      name: { type: 'string', required: true }
    }
  },
  text: {
    properties: {
      text: { type: 'string', required: true },
      style: { type: 'enum', options: PANEL_TEXT_STYLE_OPTIONS }
    }
  },
  video: {
    properties: {
      path: { type: 'media', required: true },
      poster: { type: 'media' }
    }
  },
  yesno: {
    properties: {
      text: { type: 'string', required: true },
      value_ref: { type: 'simpleAttribute', required: true }
    }
  }
};

var panel = {
  properties: {
    self: {
      type: 'variegated',
      key: 'type',
      common: PANEL_COMMON_CLASS,
      classes: PANEL_CLASSES
    }
  }
};

module.exports = {
  panel: panel
};
