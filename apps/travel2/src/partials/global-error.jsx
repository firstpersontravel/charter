import React from 'react';
import PropTypes from 'prop-types';

export default function GlobalError({ globalError = null }) {
  if (!globalError) {
    return null;
  }
  return (
    <div className="trip-error">
      Our apologies, but there was an error performing your action.
      {' '}
      <button
        className="pure-button"
        onClick={() => { window.location = window.location.href; }}>
        Please reload the page
      </button>
    </div>
  );
}

GlobalError.propTypes = {
  globalError: PropTypes.string
};
