import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link, IndexLink } from 'react-router';

export default function Player({ player, children }) {
  if (!player) {
    return <div>Player not found.</div>;
  }
  if (player.isError) {
    return <div>Error</div>;
  }
  if (player.isNull) {
    return <div>Player not found.</div>;
  }
  const trip = player.trip;
  const script = player.trip.script;
  const hasRelay = _.some(script.content.relays, r => (
    r.as === player.roleName || r.with === player.roleName
  ));
  const messageTab = hasRelay ? (
    <div className="nav-item">
      <Link
        className="nav-link"
        activeClassName="active"
        to={`/${player.org.name}/${player.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}/messages`}>
        Messages
      </Link>
    </div>
  ) : null;
  return (
    <div>
      <div className="nav nav-tabs">
        <div className="nav-item">
          <IndexLink
            className="nav-link"
            activeClassName="active"
            to={`/${player.org.name}/${player.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}`}>
            Overview
          </IndexLink>
        </div>
        {messageTab}
        <div className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${player.org.name}/${player.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}/pages`}>
            Pages
          </Link>
        </div>
        <div className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${player.org.name}/${player.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}/interface`}>
            Interface
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

Player.propTypes = {
  player: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};
