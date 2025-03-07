import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function NumberpadPanel({ panel, fireEvent }) {
  const [numberInput, setNumberInput] = useState('');
  
  const submitText = panel.submit || 'Submit';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numberInput || numberInput === '') { return; }
    
    fireEvent({
      type: 'numberpad_submitted',
      numberpad_id: panel.id,
      submission: numberInput
    });
    
    setNumberInput('');
  };
  
  return (
    <div className="page-panel-numberpad page-panel-padded">
      <form className="pure-form" onSubmit={handleSubmit}>
        <fieldset className="pure-group">
          <input
            type="number"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            className="pure-input-1"
            placeholder={panel.placeholder}
          />
          <button 
            type="submit"
            className="pure-button pure-button-primary pure-input-1">
            {submitText}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

NumberpadPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
