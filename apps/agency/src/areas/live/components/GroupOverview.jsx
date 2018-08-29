import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { IndexLink, Link } from 'react-router';

import GroupMap from '../partials/GroupMap';
import { getParticipantPageInfo, sortParticipants } from '../utils';

function renderAddUserIcon(participant) {
  if (!participant.role.user) {
    return null;
  }
  if (participant.user) {
    return null;
  }
  return (
    <span>
      &nbsp;
      <Link to={`/agency/live/${participant.trip.groupId}/all/casting`}>
        <span className="text-danger">
          <i className="fa fa-user-plus" />
        </span>
      </Link>
    </span>
  );
}

function renderActor(roleAndActors) {
  const actor = roleAndActors.actors[0];
  const pageInfo = getParticipantPageInfo(actor);
  if (!pageInfo) {
    return null;
  }
  const userNameIfMultiple = roleAndActors.roleHasMultipleUsers ?
    ` (${actor.user ? actor.user.firstName : 'No user'})` : '';
  return (
    <div key={`${roleAndActors.role.name}-${roleAndActors.userId}`} className="constrain-text">
      <IndexLink
        className={pageInfo.statusClass}
        to={`/agency/live/${actor.trip.groupId}/all/role/${roleAndActors.role.name}/${actor.userId}`}>
        <strong>
          {roleAndActors.role.name}{userNameIfMultiple}:
        </strong>
        {' '}
        {actor.trip.departureName}
        {' '}
        {pageInfo.status}
      </IndexLink>
      {renderAddUserIcon(actor)}
    </div>
  );
}

function renderPlayer(player) {
  const pageInfo = getParticipantPageInfo(player);
  if (!pageInfo) {
    return null;
  }
  return (
    <div key={player.id} className="constrain-text">
      <IndexLink
        to={`/agency/live/${player.trip.groupId}/trip/${player.trip.id}/participants/${player.role.name}`}>
        {player.trip.departureName} {player.role.name}:
        {' '}
        {pageInfo.status}
      </IndexLink>
      {renderAddUserIcon(player)}
    </div>
  );
}

function renderPlayers(tripAndPlayers) {
  const renderedPlayers = tripAndPlayers.players
    .map(player => renderPlayer(player));
  return (
    <div key={tripAndPlayers.trip.id}>
      {renderedPlayers}
    </div>
  );
}

function renderParticipants(group) {
  if (group.trips.length === 0 || !group.script) {
    return null;
  }
  const allParticipants = sortParticipants(group);
  const players = allParticipants.playersByTrip.map(renderPlayers);
  const activeActors = allParticipants.activeActorsByRole.map(renderActor);
  const inactiveActors = allParticipants.inactiveActorsByRole
    .map(renderActor);
  return (
    <div>
      <div style={{ marginBottom: '0.5em' }}>
        <h5>Players</h5>
        {players}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h5>Actors</h5>
        {activeActors}
      </div>
      {inactiveActors}
    </div>
  );
}

export default function GroupOverview({ groupStatus }) {
  const trips = _.get(groupStatus, 'instance.trips') || [];
  if (trips.length === 0) {
    return <div>No trips</div>;
  }
  return (
    <div>
      <div className="row">
        <div className="col-md-7">
          <GroupMap trips={trips} />
        </div>
        <div className="col-md-5">
          {renderParticipants(groupStatus.instance)}
        </div>
      </div>
    </div>
  );
}

GroupOverview.propTypes = {
  groupStatus: PropTypes.object.isRequired
};
