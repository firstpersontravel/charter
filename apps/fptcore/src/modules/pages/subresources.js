var _ = require('lodash');

var PANEL_BUTTON_STYLE_OPTIONS = ['solo'];
var PANEL_IMAGE_STYLE_OPTIONS = ['float-right'];
var PANEL_TEXT_STYLE_OPTIONS = ['centered', 'quest'];

var PANEL_CLASSES = {
  audio_foreground: {
    help: { summary: 'Displays an audio message that can be played at will.' },
    properties: {
      path: { type: 'media', medium: 'audio' }
    }
  },
  button: {
    help: { summary: 'Displays a button. When pressed, a cue will be signaled.' },
    properties: {
      text: { type: 'string', required: true },
      cue: { type: 'reference', collection: 'cues', required: true },
      style: { type: 'enum', options: PANEL_BUTTON_STYLE_OPTIONS }
    }
  },
  choice: {
    properties: {
      help: { summary: 'Displays a multiple choice option. When selected by a user, the curresponding value in the trip state will be updated.' },
      text: { type: 'string', required: true },
      value_ref: { type: 'simpleAttribute', required: true },
      choices: {
        type: 'list',
        required: true,
        items: {
          type: 'object',
          properties: {
            value: { type: 'string', required: true },
            text: { type: 'string', required: true }
          }
        }
      }
    }
  },
  content_browse: {
    help: { summary: 'Displays an index page of content. The user can browse through all visible content pages matching the given section.' },
    properties: {
      title: { type: 'string', required: true },
      section: { type: 'string', required: true }
    }
  },
  directions: {
    help: { summary: 'Displays live directions for the given route.' },
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
    help: { summary: 'Displays an image.' },
    properties: {
      path: { type: 'media', medium: 'image', required: true },
      style: { type: 'enum', options: PANEL_IMAGE_STYLE_OPTIONS }
    }
  },
  messages_browse: {
    help: { summary: 'Displays a browsable interface of all messages for a player.' },
    properties: {
      title: { type: 'string', required: true }
    }
  },
  messages: {
    help: { summary: 'Displays a browsable interface of all messages between a set of players.' },
    properties: {
      title: { type: 'string' },
      as: { type: 'reference', collection: 'roles', required: true },
      with: { type: 'reference', collection: 'roles', required: true }
    }
  },
  numberpad: {
    help: { summary: 'Displays a numberpad.' },
    properties: {
      submit: { type: 'string' },
      placeholder: { type: 'string' },
      unknown: { type: 'string' },
      correct_ref: { type: 'simpleAttribute', required: true },
      cue: { type: 'reference', collection: 'cues', required: true }
    }
  },
  outlet: {
    help: { summary: 'For internal use.' },
    properties: {
      name: { type: 'string', required: true }
    }
  },
  text: {
    help: { summary: 'Displays simple text.' },
    properties: {
      text: { type: 'markdown', required: true },
      style: { type: 'enum', options: PANEL_TEXT_STYLE_OPTIONS }
    }
  },
  video: {
    help: { summary: 'Displays a video.' },
    properties: {
      path: { type: 'media', medium: 'video', required: true },
      poster: { type: 'media', medium: 'image' }
    }
  },
  yesno: {
    help: { summary: 'Displays a yes/no choice. When updated, the corresponding value in the trip state will be updated.' },
    properties: {
      text: { type: 'string', required: true },
      value_ref: { type: 'simpleAttribute', required: true }
    }
  }
};

var PANEL_COMMON_CLASS = {
  properties: {
    type: {
      type: 'enum',
      options: Object.keys(PANEL_CLASSES),
      required: true
    },
    if: { type: 'ifClause' }
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

var panelSubresources = Object.assign(
  { panel: panel },
  _.mapKeys(PANEL_CLASSES, function(value, key) {
    return key + '_panel';
  })
);

module.exports = panelSubresources;
