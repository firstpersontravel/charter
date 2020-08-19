const TemplateUtil = require('../../utils/template');

const PANEL_BUTTON_STYLE_OPTIONS = ['solo'];
const PANEL_IMAGE_STYLE_OPTIONS = ['float-right'];
const PANEL_TEXT_STYLE_OPTIONS = ['centered', 'banner'];

const titleLen = 30;

function truncate(str, len) {
  if (!str) {
    return '';
  }
  return str.length > len ? `${str.slice(0, len - 2)}..` : str;
}

const panels = {};

panels.audio_foreground = {
  title: 'Audio',
  icon: 'sticky-note',
  help: 'An audio clip that can be played at will.',
  properties: {
    audio: {
      type: 'media',
      medium: 'audio',
      help: 'The audio file to play.'
    }
  },
  export(panel, actionContext) {
    return { audio: panel.audio };
  }
};

panels.button = {
  icon: 'sticky-note',
  help: 'A button.',
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
    return truncate(component.text, titleLen);
  },
  export(panel, actionContext) {
    return { text: actionContext.templateText(panel.text) };
  }
};

panels.choice = {
  icon: 'sticky-note',
  help: 'A multiple choice option. When selected by a user, the curresponding variable in the trip state will be updated.',
  properties: {
    text: {
      type: 'string',
      required: true,
      help: 'Visible title for the choice.'
    },
    value_ref: {
      title: 'Save to variable name',
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
  },
  export(panel, actionContext) {
    return {
      text: actionContext.templateText(panel.text),
      value_ref: panel.value_ref,
      choices: panel.choices
    };
  }
};

panels.content_browse = {
  title: 'Browse subpages',
  icon: 'sticky-note',
  help: 'An index page of subpages. The user can browse through all visible subpages matching a given section.',
  properties: {
    title: { type: 'string', required: true },
    section: { type: 'string', required: true }
  },
  export(panel, actionContext) {
    const contentPages = (actionContext.scriptContent.content_pages || [])
      .filter(contentPage => contentPage.section === panel.section)
      .filter(contentPage => actionContext.if(contentPage.visible_if));
    return {
      subpages: contentPages.map(contentPage => ({
        panels: (contentPage.panels || []).map(subpanel => ({
          type: subpanel.type,
          data: actionContext.registry.panels[subpanel.type].export(subpanel, actionContext)
        }))
      }))
    };
  }
};

panels.current_page = {
  icon: 'sticky-note',
  help: 'The current page for this player. Should only be used as part of an interface.',
  properties: {},
  export(panel, actionContext) {
    // should never be returned as the api_view should replace this with the current page.
    return null;
  }
};

panels.directions = {
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
  },
  getTitle(resource, component, scriptContent) {
    if (component.route) {
      const route = scriptContent.routes
        .find(r => r.name === component.route);
      return `directions along "${route.title}"`;
    }
    if (component.waypoint) {
      const waypoint = scriptContent.waypoints
        .find(r => r.name === component.waypoint);
      return `directions at "${waypoint.title}"`;
    }
    return `directions to ${component.destination_name || 'unknown'}`;
  },
  export(panel, actionContext) {
    return {};
  }
};

panels.image = {
  icon: 'sticky-note',
  help: 'An image.',
  properties: {
    image: {
      type: 'media',
      medium: 'image'
    },
    style: {
      type: 'enum',
      options: PANEL_IMAGE_STYLE_OPTIONS
    }
  }
};

panels.messages_browse = {
  title: 'Browse messages',
  icon: 'sticky-note',
  help: 'A browsable interface of all messages for a role.',
  properties: {
    as: {
      type: 'reference',
      collection: 'roles',
      help: 'Which role to view messages as. Defaults to current player.'
    }
  }
};

panels.messages = {
  title: 'Message thread',
  icon: 'sticky-note',
  help: 'All messages between two roles.',
  properties: {
    // TODO: remove this
    title: { type: 'string', display: { hidden: true } },
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
};

panels.numberpad = {
  title: 'Number entry',
  icon: 'sticky-note',
  help: 'A number input.',
  properties: {
    submit: {
      title: 'Submit button label',
      type: 'string',
      default: 'Submit'
    },
    placeholder: {
      title: 'Placeholder text',
      type: 'string'
    }
  },
  getTitle(resource, component, scriptContent) {
    return truncate(component.placeholder || '<no placeholder>', titleLen);
  }
};

panels.room = {
  icon: 'video',
  help: 'A room for audio/video conferencing.',
  properties: {
    name: {
      type: 'string',
      help: 'Optionally specify a name for your room to differentiate it from other rooms. If no name is supplied, a room will be shared for each run of your experience.'
    },
    video: {
      type: 'boolean',
      default: true,
      help: 'Send/recieve video as well as audio.'
    },
    transmit: {
      type: 'boolean',
      default: true,
      help: 'If true, the viewer of this panel will broadcast to other members of the room.'
    }
  }
};

panels.text = {
  icon: 'sticky-note',
  help: 'A simple text.',
  properties: {
    text: { type: 'markdown', required: true },
    style: {
      type: 'enum',
      options: PANEL_TEXT_STYLE_OPTIONS,
      help: 'Choose centered to center your text, or banner to give it a highlighted background.'
    }
  },
  export(panel, actionContext) {
    return {
      text: TemplateUtil.templateText(actionContext.evalContext, panel.text,
        actionContext.timezone, actionContext.triggeringRoleName)
    };
  }
};

panels.text_entry = {
  icon: 'sticky-note',
  help: 'A text entry field.',
  properties: {
    submit: {
      title: 'Submit button label',
      type: 'string',
      default: 'Submit'
    },
    placeholder: {
      title: 'Placeholder text',
      type: 'string'
    }
  },
  getTitle(resource, component, scriptContent) {
    return truncate(component.placeholder || '<no placeholder>', titleLen);
  }
};

panels.video = {
  icon: 'sticky-note',
  help: 'A video.',
  properties: {
    video: {
      type: 'media',
      medium: 'video'
    }
  }
};

panels.yesno = {
  title: 'Yes or no',
  icon: 'sticky-note',
  help: 'A yes/no choice. When updated, the corresponding variable in the trip state will be updated.',
  properties: {
    text: { type: 'string', required: true },
    value_ref: {
      title: 'Save to variable name',
      type: 'simpleAttribute',
      required: true
    }
  }
};

module.exports = panels;
