import React from 'react';
import PropTypes from 'prop-types';

export default function Scripts({ scriptsStatus, children }) {
  if (scriptsStatus.isLoading) {
    return (
      <div className="container-fluid">Loading...</div>
    );
  }
  if (scriptsStatus.isError) {
    return (
      <div className="container-fluid">Error loading data.</div>
    );
  }
  return (
    <div>
      {children}
    </div>
  );
}

Scripts.propTypes = {
  children: PropTypes.node.isRequired,
  scriptsStatus: PropTypes.object.isRequired
};
