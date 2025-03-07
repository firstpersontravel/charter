import React from 'react';
import PropTypes from 'prop-types';

const yesnoChoices = [
  { text: 'Yes', value_ref: 'true' },
  { text: 'No', value_ref: 'false' }
];

export default function YesnoPanel({ panel, evaluator, fireEvent }) {
  const humanizedText = evaluator.humanizeText(panel.text);
  const currentValue = evaluator.lookupRef(panel.value_ref);
  const choices = yesnoChoices.map((choice) => {
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
    <div className="page-panel-yesno page-panel-padded">
      {humanizedText}
      <br />
      {choices}
    </div>
  );
}

YesnoPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
