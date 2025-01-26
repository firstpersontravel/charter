import React from 'react';
import PropTypes from 'prop-types';

export default function ButtonPanel({ panel, evaluator, fireEvent }) {
  const buttonStyleClass = panel.style ? `page-panel-button-${panel.style}` : '';
  const humanizedText = evaluator.humanizeText(panel.text);
  return (
    <div className={`page-panel-button page-panel-padded ${buttonStyleClass}`}>
      <button
        className="pure-button pure-button-primary pure-button-block"
        onClick={() => fireEvent({ type: 'button_pressed', button_id: panel.id })}>
        {humanizedText}
      </button>
    </div>
  );
}

ButtonPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
