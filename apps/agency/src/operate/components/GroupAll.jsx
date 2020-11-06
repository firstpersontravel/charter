import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { RoleCore, SceneCore } from 'fptcore';

import ResponsiveTabs from '../../partials/ResponsiveTabs';

function getAllPlayers(trips) {
  return _(trips)
    .map('players')
    .flatten()
    .value();
}

const archivedIcon = <i className="fa fa-archive ml-1" />;

function renderTripItem(group, trip, isToplevel) {
  return {
    key: trip.id,
    url: (
      `/${group.org.name}/${group.experience.name}` +
      `/operate/${group.id}` +
      `/trip/${trip.id}`
    ),
    text: `${trip.title} ${trip.isArchived ? ' (archived)' : ''}`,
    label: (
      <span className={trip.isArchived ? 'faint' : ''}>
        {isToplevel ? 'Run: ' : ''}
        {trip.title} {trip.isArchived ? archivedIcon : null}
      </span>
    )
  };
}

function renderTripsItem(group, currentTripId) {
  if (!group.trips.length) {
    return null;
  }
  if (group.trips.length === 1) {
    return renderTripItem(group, group.trips[0], true);
  }
  let tripTitle = 'Runs';
  let tripLabel = 'Runs';
  if (currentTripId) {
    const trip = _.find(group.trips, { id: Number(currentTripId) });
    if (trip) {
      tripTitle = `Run: ${trip.title}`;
      tripLabel = (
        <span>
          {tripTitle}{trip.isArchived ? archivedIcon : null}
        </span>
      );
    }
  }
  return {
    text: tripTitle,
    label: tripLabel,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/trip`,
    subItems: _(group.trips)
      .sortBy(trip => [trip.isArchived, trip.title])
      .map(trip => renderTripItem(group, trip))
      .value()
  };
}

export default function GroupAll({ children, group, nextUnappliedAction,
  numMessagesNeedingReply, match, history }) {
  // Error or loading cases should be handled by `Group`
  if (group.trips.length === 0) {
    return <div>No trips</div>;
  }
  const roles = _(group.script.content.roles)
    .filter(role => RoleCore.canRoleHaveParticipant(group.script.content, role))
    .sort(SceneCore.sortResource)
    .value();
  const allPlayers = getAllPlayers(group.trips);
  const allParticipants = _(allPlayers).map('participant').uniq().value();

  function isParticipantArchived(participant) {
    if (!participant) {
      return false;
    }
    const players = allPlayers.filter(p => p.participantId === participant.id);
    const trips = players.map(p => group.trips.find(t => p.tripId === t.id));
    return _.every(trips, t => t.isArchived);
  }

  let roleTitle = 'Participants';
  let roleLabel = roleTitle;

  const path = history.location.pathname;
  const pathRoleMatch = path.match(/\/role\/([\w_-]+)\/(\d+)/);
  const pathRoleName = pathRoleMatch ? pathRoleMatch[1] : null;
  const pathParticipantId = pathRoleMatch ? pathRoleMatch[2] : null;

  if (pathRoleName && pathParticipantId) {
    const role = _.find(group.script.content.roles, { name: pathRoleName });
    const pathParticipant = pathParticipantId !== '0' ?
      _.find(allParticipants, { id: Number(pathParticipantId) }) : null;
    const participantName = pathParticipant ? pathParticipant.name : '';
    const participantSuffix = participantName ? ` (${participantName})` : '';
    const isArchived = pathParticipant && isParticipantArchived(pathParticipant);
    roleTitle = `Participant: ${role.title}${participantSuffix}`;
    roleLabel = (
      <span>{roleTitle}{isArchived ? archivedIcon : null}</span>
    );
  }

  const pathTripMatch = path.match(/\/trip\/(\d+)/);
  const pathTripId = pathTripMatch ? pathTripMatch[1] : null;
  const tripsItem = renderTripsItem(group, pathTripId);

  function itemsForRole(role) {
    const participants = _(allPlayers)
      .filter(player => player.role && player.role.interface)
      .filter({ roleName: role.name })
      .map('participant')
      .uniq()
      .value();

    return _(participants)
      .sortBy(p => [isParticipantArchived(p), p && p.name])
      .map((participant) => {
        const isArchived = isParticipantArchived(participant);
        const title = `${role.title} (${participant ? participant.name : 'No user'})`;
        return {
          url: (
            `/${group.org.name}/${group.experience.name}` +
            `/operate/${group.id}` +
            `/role/${role.name}/${participant ? participant.id : 0}`
          ),
          label: (
            <span className={isArchived ? 'faint' : ''}>
              {title}{isArchived ? archivedIcon : null}
            </span>
          ),
          text: `${title} ${isArchived ? ' (archived)' : ''}`
        };
      })
      .flatten()
      .value();
  }

  const roleItems = _(roles)
    .map(role => itemsForRole(role))
    .flatten()
    .value();

  const items = [{
    text: 'Run group',
    isExact: true,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}`
  }, {
    text: roleTitle,
    label: roleLabel,
    url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/role`,
    subItems: roleItems
  }, tripsItem];

  if (numMessagesNeedingReply) {
    items.push({
      label: (
        <span>
          <span style={{ position: 'relative', top: '-2px' }} className="badge badge-warning mr-1">
            <i className="fa fa-comment" />
            {numMessagesNeedingReply}
          </span>
          Messages
        </span>
      ),
      text: 'Messages',
      url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/messages`
    });
  }

  if (nextUnappliedAction) {
    items.push({
      text: 'Upcoming',
      label: (
        <span>
          <span style={{ position: 'relative', top: '-2px' }} className="badge badge-info mr-1">
            {moment
              .utc(nextUnappliedAction.scheduledAt)
              .tz(group.experience.timezone)
              .format('h:mm:ssa')}
          </span>
          Upcoming
        </span>
      ),
      url: `/${group.org.name}/${group.experience.name}/operate/${group.id}/upcoming`
    });
  }

  return (
    <div>
      <ResponsiveTabs items={items} history={history} />
      {children}
    </div>
  );
}

GroupAll.propTypes = {
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
  nextUnappliedAction: PropTypes.object,
  numMessagesNeedingReply: PropTypes.number.isRequired
};

GroupAll.defaultProps = {
  nextUnappliedAction: null
};
