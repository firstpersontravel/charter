import React from 'react';
import PropTypes from 'prop-types';

export default function VideoPanel({ panel }) {
  if (!panel.video) {
    return null;
  }

  return (
    <div className="page-panel-video">
      <video src={panel.video} controls preload="auto" />
    </div>
  );
}

VideoPanel.propTypes = {
  panel: PropTypes.object.isRequired
};
