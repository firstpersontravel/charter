import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function TextEntryPanel({ panel, fireEvent }) {
  const [textInput, setTextInput] = useState('');
  
  const submitText = panel.submit || 'Submit';
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput || textInput === '') { return; }
    
    fireEvent({
      type: 'text_entry_submitted',
      text_entry_id: panel.id,
      submission: textInput
    });
    
    setTextInput('');
  };
  
  return (
    <div className="page-panel-text-entry page-panel-padded">
      <form className="pure-form" onSubmit={handleSubmit}>
        <fieldset className="pure-group">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
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

TextEntryPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
