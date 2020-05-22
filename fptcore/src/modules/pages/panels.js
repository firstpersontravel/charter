var PANEL_BUTTON_STYLE_OPTIONS = ['solo'];
var PANEL_IMAGE_STYLE_OPTIONS = ['float-right'];
var PANEL_TEXT_STYLE_OPTIONS = ['centered', 'banner'];

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
    getTitle(resource, component, scriptContent) {
      return component.text;
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
  current_page: {
    icon: 'sticky-note',
    help: 'Shows the current page for this player. Should only be used as part of an interface.',
    properties: {}
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
      as: {
        type: 'reference',
        collection: 'roles',
        help: 'Which role to view messages as. Defaults to current player.'
      }
    }
  },
  messages: {
    icon: 'sticky-note',
    help: 'Displays a browsable interface of all messages between a set of players.',
    properties: {
      title: { type: 'string' },
      with: {
        type: 'reference',
        collection: 'roles',
        required: true,
        help: 'Which role to view messages with.'
      },
      as: {
        type: 'reference',
        collection: 'roles',
        help: 'Which role to view messages as. Defaults to current player.'
      }
    }
  },
  numberpad: {
    icon: 'sticky-note',
    help: 'Displays a numberpad.',
    properties: {
      submit: { type: 'string', default: 'Submit' },
      placeholder: { type: 'string' }
    },
    getTitle(resource, component, scriptContent) {
      return component.placeholder || '<no placeholder>';
    }
  },
  text: {
    icon: 'sticky-note',
    help: 'Displays simple text.',
    properties: {
      text: { type: 'markdown', required: true },
      style: {
        type: 'enum',
        options: PANEL_TEXT_STYLE_OPTIONS,
        help: 'Choose centered to center your text, or banner to give it a highlighted background.'
      }
    }
  },
  text_entry: {
    icon: 'sticky-note',
    help: 'Displays a text entry field.',
    properties: {
      submit: { type: 'string', default: 'Submit' },
      placeholder: { type: 'string' }
    },
    getTitle(resource, component, scriptContent) {
      return component.placeholder || '<no placeholder>';
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
