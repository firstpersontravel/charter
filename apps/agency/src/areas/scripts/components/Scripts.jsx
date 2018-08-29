import React from 'react';
import PropTypes from 'prop-types';

export default function Scripts({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

Scripts.propTypes = {
  children: PropTypes.node.isRequired
};
