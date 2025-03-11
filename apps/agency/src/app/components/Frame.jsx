import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Frame({
  authInfo, org, experience, experiences, children
}) {
  return (
    <div>
      <Nav
        authInfo={authInfo}
        org={org}
        experience={experience}
        experiences={experiences} />
      {children}
    </div>
  );
}

Frame.propTypes = {
  authInfo: PropTypes.object,
  org: PropTypes.object,
  experience: PropTypes.object,
  experiences: PropTypes.array,
  children: PropTypes.node.isRequired
};

Frame.defaultProps = {
  authInfo: null,
  org: null,
  experience: null,
  experiences: null
};
