import React from 'react';
import PropTypes from 'prop-types';

import { adjustColorBrightness, chooseTextColor } from '../util/color-util';

export default function CustomCss({ iface }) {
  if (!iface) {
    return null;
  }
  const bgColor = iface.background_color || '#ffffff';
  const headerColor = iface.header_color || '#aaaaaa';
  const accentColor = iface.accent_color || '#888888';
  const primaryColor = iface.primary_color || '#bb0000';
  const colors = {
    bg: bgColor,
    bgDark: adjustColorBrightness(bgColor, -10),
    bgDarker: adjustColorBrightness(bgColor, -30),
    bgText: chooseTextColor(bgColor),
    header: headerColor,
    headerDark: adjustColorBrightness(headerColor, -10),
    headerDarker: adjustColorBrightness(headerColor, -30),
    headerText: chooseTextColor(headerColor),
    accent: accentColor,
    accentDarker: adjustColorBrightness(accentColor, -30),
    accentText: chooseTextColor(accentColor),
    primary: primaryColor,
    primaryText: chooseTextColor(primaryColor)
  };
  const fontFamily = iface.font_family || 'Raleway';
  const customCss = iface.custom_css || '';
  const style = `
    html, button, input, select, textarea, .pure-g [class *= "pure-u"] {
      font-family: ${fontFamily};
    }
    body {
      background-color: ${colors.header};
      background-image: linear-gradient(to bottom, {{ colors.bg }} 0%, {{ colors.bg }} 100%);
      color: ${colors.bgText};
    }

    .application-loading, .application-error, .trip-container { background: ${colors.bg}; }

    .trip-soundtrack, .trip-soundtrack a, .page-panel-text.page-panel-text-banner, .application-debug-console {
      background: ${colors.header};
      color: ${colors.headerText};
    }
    .pure-menu { background: ${colors.header}; }
    .pure-menu .pure-menu-link { color: ${colors.headerText}; }
    .pure-menu .pure-menu-link:focus, .pure-menu .pure-menu-link:hover { background: {{ colors.headerDark}}; }
    .pure-menu .pure-menu-selected .pure-menu-link {
      background: ${colors.accent};
      color: ${colors.accentText};
    }
    label.pure-button, button.pure-button, a.pure-button {
      background: ${colors.bgDarker};
      color: ${colors.bgText};
    }
    label.pure-button-primary, button.pure-button-primary, a.pure-button-primary {
      background: ${colors.primary};
      color: ${colors.primaryText};
    }
    label.pure-button-selected, button.pure-button-selected, a.pure-button-selected {
      background: ${colors.accentDarker};
      color: ${colors.accentText};
    }

    .pure-table { border: 0; }
    .pure-table td { border: 0; }
    .pure-table-striped tr:nth-child(2n-1) td {
      background: ${colors.bgDark};
    }

    .page-panel-messages .messages-item-incoming .msg { background: ${colors.bgDarker}; }
    .page-panel-messages .messages-item-outgoing .msg {
      background: ${colors.primary};
      color: ${colors.primaryText};
      opacity: 0.8;
    }

    ${customCss}
  `;
  return (
    <style>{style}</style>
  );
}

CustomCss.propTypes = {
  iface: PropTypes.object
};

CustomCss.defaultProps = {
  iface: null
};
