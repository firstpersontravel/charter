import React from 'react';
import PropTypes from 'prop-types';

export default function Role({ params, user, children }) {
  return (
    <div>
      {children}
    </div>
  );
}

Role.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.object,
  params: PropTypes.object.isRequired
};

Role.defaultProps = {
  user: null
};
