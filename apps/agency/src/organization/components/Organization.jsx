import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Organization({ authInfo, children, logout, org }) {
  const notFound = (
    <div className="container-fluid">
      Organization not found.
    </div>
  );
  const inner = org ? children : notFound;
  return (
    <div>
      <Nav
        authInfo={authInfo}
        logout={logout}
        org={org} />
      {inner}
    </div>
  );
}

Organization.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  org: PropTypes.object,
  logout: PropTypes.func.isRequired
};

Organization.defaultProps = {
  org: null,
  authInfo: null
};
