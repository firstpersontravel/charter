import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Public({ authInfo, children, logout }) {
  return (
    <div>
      <Nav authInfo={authInfo} logout={logout} />
      {children}
    </div>
  );
}

Public.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  logout: PropTypes.func.isRequired
};

Public.defaultProps = {
  authInfo: null
};
