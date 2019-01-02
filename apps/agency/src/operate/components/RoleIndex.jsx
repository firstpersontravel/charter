import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import L from 'leaflet';
import { Link } from 'react-router';

import { EvalCore } from 'fptcore';

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
      center={center}
      zoom={15}
      trips={[trip]} />
  );
}

function renderUser(user) {
  if (!user) {
    return 'None';
  }
  return (
    <Link
      to={`/agency/users/user/${user.id}`}>
      {user.firstName} {user.lastName}
    </Link>
  );
}

function renderPlayerCell(player, isFirst) {
  const trip = player.trip;
  const page = _.find(player.trip.script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return null;
  }
  const appearance = _.find(trip.script.content.appearances, {
    name: page.appearance
  }) || {};
  const appearanceIsActive = !appearance.if || EvalCore.if(trip.evalContext, appearance.if);
  const pageTitle = page ? page.title : player.currentPageName;
  const status = appearanceIsActive ? pageTitle : appearance.disabled_message;
  const tripRoleUrl = `/agency/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}`;

  const renderedMap = isFirst ? renderMap(trip, player.user) : null;
  const renderedUser = isFirst ? (
    <div>
      <strong>User:</strong> {renderUser(player.user)}
    </div>
  ) : null;

  return (
    <div className="row" key={player.id}>
      <div className="col-sm-6">
        <Preview player={player} />
      </div>
      <div className="col-sm-6">
        {renderedMap}
        {renderedUser}
        <p>
          <strong>Player:</strong>
          {' '}
          <Link to={tripRoleUrl} activeClassName="bold">
            {trip.departureName} {status}
          </Link>
          <br />
          <strong>Page:</strong> {pageTitle}
        </p>
      </div>
    </div>
  );
}

export default function RoleIndex({ user, players }) {
  if (!players.length) {
    return <div>Loading</div>;
  }
  const playersSorted = _(players)
    .filter('trip')
    .filter('currentPageName')
    .sortBy((player) => {
      const appearanceStart = getAppearanceStart(player);
      return appearanceStart ? appearanceStart.unix() : 0;
    })
    .value();
  if (!playersSorted.length) {
    return <div>No players</div>;
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
