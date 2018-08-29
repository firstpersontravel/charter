import React from 'react';
import PropTypes from 'prop-types';
import { IndexLink, Link } from 'react-router';

export default function Role({ params, groupStatus, user, children }) {
  if (groupStatus.isError) {
    return <div>Error - please refresh</div>;
  }
  if (groupStatus.isLoading ||
      !groupStatus.instance ||
      !groupStatus.instance.script) {
    return <div>Loading</div>;
  }
  const interfaceTab = user ? (
    <li className="nav-item">
      <Link
        className="nav-link"
        activeClassName="active"
        to={`/agency/live/${params.groupId}/all/role/${params.roleName}/${params.userId}/interface`}>
        Interface
      </Link>
    </li>
  ) : null;
  return (
    <div>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <IndexLink
            className="nav-link"
            activeClassName="active"
            to={`/agency/live/${params.groupId}/all/role/${params.roleName}/${params.userId}`}>
            {params.roleName} ({user ? user.firstName : 'No user'})
          </IndexLink>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/agency/live/${params.groupId}/all/role/${params.roleName}/${params.userId}/messages`}>
            Messages
          </Link>
        </li>
        {interfaceTab}
      </ul>
      {children}
    </div>
  );
}

Role.propTypes = {
  children: PropTypes.node.isRequired,
  groupStatus: PropTypes.object.isRequired,
  user: PropTypes.object,
  params: PropTypes.object.isRequired
};

Role.defaultProps = {
  user: null
};
