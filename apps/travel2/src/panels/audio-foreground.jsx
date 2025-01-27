import React from 'react';
import PropTypes from 'prop-types';

export default function AudioForegroundPanel({ panel }) {
  if (!panel.audio) {
    return null;
  }
  return (
    <div className="page-panel-audio-foreground">
      <div style={{ margin: '1em' }}>
        <audio src={panel} controls> </audio>
      </div>
    </div>
  );
}

AudioForegroundPanel.propTypes = {
  panel: PropTypes.object.isRequired
};
