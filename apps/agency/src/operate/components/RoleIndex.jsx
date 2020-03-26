import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import L from 'leaflet';
import { NavLink, Link } from 'react-router-dom';

import Preview from '../partials/Preview';
import GroupMap from '../partials/GroupMap';

function getAppearanceStart(player) {
  const page = _.find(player.trip.script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return null;
  }
  const appearance = _.find(player.trip.script.content.appearances,
    { name: page.appearance });
  if (!appearance || !appearance.start) {
    return null;
  }
  if (!player.trip.schedule[appearance.start]) {
    return null;
  }
  return moment.utc(player.trip.schedule[appearance.start]);
}

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
  const page = _.find(player.trip.script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return (
      <div key={player.id} className="alert alert-warning">
        No active page for trip {player.trip.title}.
      </div>
    );
  }
  const pageTitle = page ? page.title : player.currentPageName;
  const tripRoleUrl = `/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}`;

  const renderedMap = isFirst ?
    renderMap(trip, player.user) : null;
  const renderedUser = isFirst ? (
    <div>
      <strong>User:</strong> {renderUser(player, player.user)}
    </div>
  ) : null;

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
            {trip.departureName} {pageTitle}
          </NavLink>
          <br />
          <strong>Page:</strong> {pageTitle}
        </p>
      </div>
    </div>
  );
}

export default function RoleIndex({ user, players }) {
  const playersSorted = _(players)
    .filter('trip.script')
    .filter('currentPageName')
    .sortBy((player) => {
      const appearanceStart = getAppearanceStart(player);
      return appearanceStart ? appearanceStart.unix() : 0;
    })
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
