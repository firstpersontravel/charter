import React from 'react';
import PropTypes from 'prop-types';

export default function Role({ user, children }) {
  return (
    <div>
      {children}
    </div>
  );
}

Role.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.object
};

Role.defaultProps = {
  user: null
};
