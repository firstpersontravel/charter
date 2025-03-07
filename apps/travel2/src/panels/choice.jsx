import React from 'react';
import PropTypes from 'prop-types';

export default function ChoicePanel({ panel, evaluator, fireEvent }) {
  const humanizedText = evaluator.humanizeText(panel.text);
  const currentValue = evaluator.lookupRef(panel.value_ref);
  const choices = panel.choices.map((choice) => {
    const isSelected = choice.value === currentValue;
    return (
      <button
        className={`pure-button ${isSelected ? 'pure-button-selected' : ''}`}
        onClick={() => fireEvent({
          type: 'set_value',
          value_ref: panel.value_ref,
          new_value_ref: `"${choice.value}"`
        })}>
        {evaluator.humanizeText(choice.text)}
      </button>
    );
  });
  return (
    <div className="page-panel-choice page-panel-padded">
      {humanizedText}
      <br />
      {choices}
    </div>
  );
}

ChoicePanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
