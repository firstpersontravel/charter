import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import L from 'leaflet';
import { NavLink, Link } from 'react-router-dom';

import Preview from '../partials/Preview';
import GroupMap from '../partials/GroupMap';
import { getPlayerIframeUrl } from '../../utils';

function renderMap(trip, participant) {
  if (!participant || !participant.locationLatitude) {
    return <div>No location available</div>;
  }
  const center = L.latLng(
    participant.locationLatitude,
    participant.locationLongitude);
  return (
    <GroupMap
      group={trip.group}
      center={center}
      zoom={15}
      trips={[trip]} />
  );
}

function renderParticipant(player, participant) {
  if (!participant) {
    return 'None';
  }
  return (
    <Link
      to={`/${player.org.name}/${player.experience.name}/directory/${participant.id}`}>
      {participant.name}
    </Link>
  );
}

function renderPlayerPage(trip, player, page) {
  if (!page) {
    return (
      <div key={player.id} className="alert alert-warning">
        No active page for trip {player.trip.title}.
      </div>
    );
  }
  return (
    <Preview trip={trip} player={player} page={page} />
  );
}

function renderPlayerCell(player, isFirst) {
  const trip = player.trip;
  const pageName = trip.tripState.currentPageNamesByRole[player.roleName];
  const page = _.find(player.trip.script.content.pages, { name: pageName });
  const pageTitle = page ? page.title : 'None';
  const tripRoleUrl = `/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${player.roleName}`;

  const renderedMap = isFirst ?
    renderMap(trip, player.participant) : null;
  const renderedParticipant = isFirst ? (
    <div>
      <strong>User:</strong> {renderParticipant(player, player.participant)}
    </div>
  ) : null;

  const joinUrl = `/entry/t/${trip.id}/r/${player.roleName}`;
  const joinLink = player.participant ? null : (
    <div>
      <strong>Join:</strong>&nbsp;
      <a href={joinUrl} target="_blank" rel="noopener noreferrer">
        <i className="fa fa-external-link-alt" />
      </a>
    </div>
  );

  let audioStateTitle = 'None';
  const audioStates = trip.tripState.audioStateByRole || {};
  const audioState = audioStates[player.roleName] || {};
  if (audioState.url) {
    const audioPrefix = audioState.title ? `${audioState.title}: ` : '';
    if (audioState.isPlaying) {
      audioStateTitle = `${audioPrefix}Playing (or ended)`;
    } else {
      audioStateTitle = `${audioPrefix}Paused`;
    }
  }

  return (
    <div className="row" key={player.id}>
      <div className="col-sm-6">
        {renderPlayerPage(trip, player, page)}
      </div>
      <div className="col-sm-6">
        {renderedMap}
        {renderedParticipant}
        <div>
          <strong>Trip:</strong>
          {' '}
          <NavLink to={tripRoleUrl} activeClassName="bold">
            {trip.title}
          </NavLink>
        </div>
        <div>
          <strong>Page:</strong> {pageTitle}
        </div>
        <div>
          <strong>Audio:</strong> {audioStateTitle}
        </div>
        <div>
          <strong>Interface:</strong>&nbsp;
          <a href={getPlayerIframeUrl(trip, player)} target="_blank" rel="noopener noreferrer">
            <i className="fa fa-external-link-alt" />
          </a>
          {joinLink}
        </div>
      </div>
    </div>
  );
}

export default function RoleIndex({ participant, players }) {
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
  participant: PropTypes.object,
  players: PropTypes.array.isRequired
};

RoleIndex.defaultProps = {
  participant: null
};
