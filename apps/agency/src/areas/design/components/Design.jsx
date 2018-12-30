import React from 'react';
import PropTypes from 'prop-types';

export default function Design({ scriptsStatus, children }) {
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

Design.propTypes = {
  children: PropTypes.node.isRequired,
  scriptsStatus: PropTypes.object.isRequired
};
