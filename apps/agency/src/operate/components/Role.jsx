import React from 'react';
import PropTypes from 'prop-types';

export default function Role({ participant, children }) {
  return (
    <div>
      {children}
    </div>
  );
}

Role.propTypes = {
  children: PropTypes.node.isRequired,
  participant: PropTypes.object
};

Role.defaultProps = {
  participant: null
};
