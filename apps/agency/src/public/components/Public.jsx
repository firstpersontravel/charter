import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Public({ authInfo, children }) {
  return (
    <div>
      <Nav authInfo={authInfo} />
      {children}
    </div>
  );
}

Public.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired
};

Public.defaultProps = {
  authInfo: null
};
