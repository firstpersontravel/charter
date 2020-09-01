import React from 'react';
import PropTypes from 'prop-types';

import Nav from '../../partials/Nav';

export default function Frame({
  authInfo, org, experience, experiences, groups, groupId, children }) {
  return (
    <div>
      <Nav
        authInfo={authInfo}
        org={org}
        experience={experience}
        experiences={experiences}
        groups={groups}
        groupId={groupId} />
      {children}
    </div>
  );
}

Frame.propTypes = {
  authInfo: PropTypes.object,
  org: PropTypes.object,
  experience: PropTypes.object,
  experiences: PropTypes.array,
  groups: PropTypes.array,
  groupId: PropTypes.number,
  children: PropTypes.node.isRequired
};

Frame.defaultProps = {
  authInfo: null,
  org: null,
  experience: null,
  experiences: null,
  groups: null,
  groupId: null
};
