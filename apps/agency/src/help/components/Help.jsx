import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Help({ children, authInfo }) {
  return (
    <div>
      <Nav authInfo={authInfo} />
      {children}
    </div>
  );
}

Help.propTypes = {
  children: PropTypes.node.isRequired,
  authInfo: PropTypes.object.isRequired
};
