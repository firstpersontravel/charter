import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Organization({ authInfo, children, logout,
  organization }) {
  const notFound = (
    <div>Organization not found.</div>
  );
  const inner = organization ? children : notFound;
  return (
    <div>
      <Nav
        authInfo={authInfo}
        logout={logout}
        organization={organization} />
      {inner}
    </div>
  );
}

Organization.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  organization: PropTypes.object,
  logout: PropTypes.func.isRequired
};

Organization.defaultProps = {
  organization: null,
  authInfo: null
};
