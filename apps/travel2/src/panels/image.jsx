import React from 'react';
import PropTypes from 'prop-types';

export default function ImagePanel({ panel, evaluator }) {
  const imageStyleClass = panel.style ? `page-panel-image-${panel.style}` : '';
  const fullPath = evaluator.humanizeText(panel.image);
  if (!fullPath) {
    return null;
  }
  return (
    <div className={`page-panel-image ${imageStyleClass}`}>
      <img style={{ padding: '1em' }} src={fullPath} />
    </div>
  );
}

ImagePanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired
};
