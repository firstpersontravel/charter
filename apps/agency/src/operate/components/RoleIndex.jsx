import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { NavLink, Link } from 'react-router-dom';

import Preview from '../partials/Preview';
import GroupMap from '../partials/GroupMap';
import { getPlayerIframeUrl } from '../../utils';

function renderMap(trip, user) {
  if (!user || !user.locationLatitude) {
    return <div>No location available</div>;
  }
  const center = L.latLng(
    user.locationLatitude,
    user.locationLongitude);
  return (
    <GroupMap
      group={trip.group}
      center={center}
      zoom={15}
      trips={[trip]} />
  );
}

function renderUser(player, user) {
  if (!user) {
    return 'None';
  }
  return (
    <Link
      to={`/${player.org.name}/${player.experience.name}/directory/user/${user.id}`}>
      {user.firstName} {user.lastName}
    </Link>
  );
}

function renderPlayerCell(player, isFirst) {
  const trip = player.trip;
  const pageName = trip.tripState.currentPageNamesByRole[player.roleName];
  const page = _.find(player.trip.script.content.pages, { name: pageName });
  if (!page) {
    return (
      <div key={player.id} className="alert alert-warning">
        No active page for trip {player.trip.title}.
      </div>
    );
  }
  const pageTitle = page ? page.title : pageName;
  const tripRoleUrl = `/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}`;

  const renderedMap = isFirst ?
    renderMap(trip, player.user) : null;
  const renderedUser = isFirst ? (
    <div>
      <strong>User:</strong> {renderUser(player, player.user)}
    </div>
  ) : null;

  const joinUrl = `/entry/t/${trip.id}/r/${player.roleName}`;
  const joinLink = player.user ? null : (
    <div>
      <strong>Join:</strong>&nbsp;
      <a href={joinUrl} target="_blank" rel="noopener noreferrer">
        <i className="fa fa-external-link" />
      </a>
    </div>
  );

  return (
    <div className="row" key={player.id}>
      <div className="col-sm-6">
        <Preview trip={trip} player={player} page={page} />
      </div>
      <div className="col-sm-6">
        {renderedMap}
        {renderedUser}
        <p>
          <strong>Player:</strong>
          {' '}
          <NavLink to={tripRoleUrl} activeClassName="bold">
            {trip.title} {pageTitle}
          </NavLink>
          <br />
          <strong>Page:</strong> {pageTitle}
          <br />
          <strong>Interface:</strong>&nbsp;
          <a href={getPlayerIframeUrl(trip, player)} target="_blank" rel="noopener noreferrer">
            <i className="fa fa-external-link" />
          </a>
          {joinLink}
        </p>
      </div>
    </div>
  );
}

export default function RoleIndex({ user, players }) {
  const playersSorted = _(players)
    .filter('trip.script')
    .filter(player => !!player.role.interface)
    .value();
  if (!playersSorted.length) {
    return <div>No players with active interfaces.</div>;
  }
  const renderedPlayers = playersSorted.map((player, i) => (
    renderPlayerCell(player, i === 0)
  ));
  return (
    <div>
      {renderedPlayers}
    </div>
  );
}

RoleIndex.propTypes = {
  user: PropTypes.object,
  players: PropTypes.array.isRequired
};

RoleIndex.defaultProps = {
  user: null
};
