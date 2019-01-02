import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link, IndexLink } from 'react-router';

export default function Player({ params, groupStatus, playerStatus, children }) {
  if (groupStatus.isError ||
      playerStatus.isError) {
    return <div>Error - please refresh</div>;
  }
  if (groupStatus.isLoading ||
    !playerStatus.instance ||
    !playerStatus.instance.trip ||
    !playerStatus.instance.trip.script) {
    return <div>Loading</div>;
  }
  const script = playerStatus.instance.trip.script;
  const hasRelay = !!_.find(script.content.relays, { as: params.roleName });
  const messageTab = hasRelay ? (
    <li className="nav-item">
      <Link
        className="nav-link"
        activeClassName="active"
        to={`/operate/${params.groupId}/trip/${params.tripId}/players/${params.roleName}/messages`}>
        Messages
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
            to={`/operate/${params.groupId}/trip/${params.tripId}/players/${params.roleName}`}>
            {params.roleName}
          </IndexLink>
        </li>
        {messageTab}
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/players/${params.roleName}/pages`}>
            Pages
          </Link>
        </li>
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/operate/${params.groupId}/trip/${params.tripId}/players/${params.roleName}/interface`}>
            Interface
          </Link>
        </li>
      </ul>
      {children}
    </div>
  );
}

Player.propTypes = {
  groupStatus: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  playerStatus: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
