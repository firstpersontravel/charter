var PANEL_BUTTON_STYLE_OPTIONS = ['solo'];
var PANEL_IMAGE_STYLE_OPTIONS = ['float-right'];
var PANEL_TEXT_STYLE_OPTIONS = ['centered', 'quest'];

module.exports = {
  audio_foreground: {
    icon: 'sticky-note',
    help: 'Displays an audio message that can be played at will.',
    properties: {
      path: {
        type: 'media',
        medium: 'audio',
        display: { hidden: true },
        help: 'The audio file to play.'
      }
    }
  },
  button: {
    icon: 'sticky-note',
    help: 'Displays a button.',
    properties: {
      text: {
        type: 'string',
        required: true,
        help: 'Visible label on the button.'
      },
      style: {
        type: 'enum',
        options: PANEL_BUTTON_STYLE_OPTIONS
      }
    },
    getTitle(resource, scriptContent) {
      return resource.text;
    }
  },
  choice: {
    icon: 'sticky-note',
    help: 'Displays a multiple choice option. When selected by a user, the curresponding value in the trip state will be updated.',
    properties: {
      text: {
        type: 'string',
        required: true,
        help: 'Visible title for the choice.'
      },
      value_ref: {
        type: 'simpleAttribute',
        required: true
      },
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
    icon: 'sticky-note',
    help: 'Displays an index page of content. The user can browse through all visible content pages matching the given section.',
    properties: {
      title: { type: 'string', required: true },
      section: { type: 'string', required: true }
    }
  },
  directions: {
    icon: 'sticky-note',
    help: 'Displays live directions for the given route.',
    properties: {
      route: { type: 'reference', collection: 'routes' },
      waypoint: { type: 'reference', collection: 'waypoints' },
      geofence: { type: 'reference', collection: 'geofences' },
      destination_name: { type: 'string' }
    },
    validateResource: function(script, resource) {
      if (!resource.route && !resource.waypoint) {
        return ['Directions panel requires either a route or a waypoint.'];
      }
    }
  },
  image: {
    icon: 'sticky-note',
    help: 'Displays an image.',
    properties: {
      path: {
        type: 'media',
        medium: 'image',
        display: { hidden: true },
        required: true
      },
      style: { type: 'enum', options: PANEL_IMAGE_STYLE_OPTIONS }
    }
  },
  messages_browse: {
    icon: 'sticky-note',
    help: 'Displays a browsable interface of all messages for a player.',
    properties: {
      title: { type: 'string', required: true }
    }
  },
  messages: {
    icon: 'sticky-note',
    help: 'Displays a browsable interface of all messages between a set of players.',
    properties: {
      title: { type: 'string' },
      as: { type: 'reference', collection: 'roles', required: true },
      with: { type: 'reference', collection: 'roles', required: true }
    }
  },
  numberpad: {
    icon: 'sticky-note',
    help: 'Displays a numberpad.',
    properties: {
      submit: { type: 'string' },
      placeholder: { type: 'string' }
    }
  },
  outlet: {
    icon: 'sticky-note',
    help: 'For internal use.',
    properties: {
      name: { type: 'string', required: true }
    }
  },
  text: {
    icon: 'sticky-note',
    help: 'Displays simple text.',
    properties: {
      text: { type: 'markdown', required: true },
      style: { type: 'enum', options: PANEL_TEXT_STYLE_OPTIONS }
    }
  },
  video: {
    icon: 'sticky-note',
    help: 'Displays a video.',
    properties: {
      path: {
        type: 'media',
        medium: 'video',
        display: { hidden: true },
        required: true
      }
    }
  },
  yesno: {
    icon: 'sticky-note',
    help: 'Displays a yes/no choice. When updated, the corresponding value in the trip state will be updated.',
    properties: {
      text: { type: 'string', required: true },
      value_ref: { type: 'simpleAttribute', required: true }
    }
  }
};
