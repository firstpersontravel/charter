import React from 'react';
import PropTypes from 'prop-types';
import { IndexLink, Link } from 'react-router';

export default function Role({ params, user, children }) {
  const orgName = params.orgName;
  const experienceName = params.experienceName;
  const interfaceTab = user ? (
    <li className="nav-item">
      <Link
        className="nav-link"
        activeClassName="active"
        to={`/${orgName}/${experienceName}/operate/${params.groupId}/role/${params.roleName}/${params.userId}/interface`}>
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
            to={`/${orgName}/${experienceName}/operate/${params.groupId}/role/${params.roleName}/${params.userId}`}>
            Players
          </IndexLink>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${orgName}/${experienceName}/operate/${params.groupId}/role/${params.roleName}/${params.userId}/messages`}>
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
  user: PropTypes.object,
  params: PropTypes.object.isRequired
};

Role.defaultProps = {
  user: null
};
