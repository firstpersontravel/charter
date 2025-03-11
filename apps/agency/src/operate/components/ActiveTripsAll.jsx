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

function renderTripItem(org, experience, trip, isToplevel) {
  return {
    key: trip.id,
    url: (
      `/${org.name}/${experience.name}`
      + `/operate/trip/${trip.id}`
    ),
    text: `${trip.title} ${trip.isArchived ? ' (archived)' : ''}`,
    label: (
      <span className={trip.isArchived ? 'faint' : ''}>
        {isToplevel ? 'Run: ' : ''}
        {trip.title}
        {' '}
        {trip.isArchived ? archivedIcon : null}
      </span>
    )
  };
}

function renderTripsItem(org, experience, trips, currentTripId) {
  if (!trips.length) {
    return null;
  }
  if (trips.length === 1) {
    return renderTripItem(org, experience, trips[0], true);
  }
  let tripTitle = 'Runs';
  let tripLabel = 'Runs';
  if (currentTripId) {
    const trip = _.find(trips, { id: Number(currentTripId) });
    if (trip) {
      tripTitle = `Run: ${trip.title}`;
      tripLabel = (
        <span>
          {tripTitle}
          {trip.isArchived ? archivedIcon : null}
        </span>
      );
    }
  }
  return {
    text: tripTitle,
    label: tripLabel,
    url: `/${org.name}/${experience.name}/operate/trip`,
    subItems: _(trips)
      .sortBy(trip => [trip.isArchived, trip.title])
      .map(trip => renderTripItem(org, experience, trip))
      .value()
  };
}

export default function ActiveTripsAll({
  children, org, experience, trips, nextUnappliedAction,
  numMessagesNeedingReply, match, history
}) {
  // Error or loading cases should be handled by `Group`
  if (trips.length === 0) {
    return <div>No trips</div>;
  }
  const { script } = trips[0];
  const roles = _(script.content.roles)
    .filter(role => RoleCore.canRoleHaveParticipant(script.content, role))
    .sort(SceneCore.sortResource)
    .value();
  const allPlayers = getAllPlayers(trips);
  const allParticipants = _(allPlayers).map('participant').uniq().value();

  function isParticipantArchived(participant, roleName) {
    const participantId = participant ? participant.id : null;
    const players = allPlayers.filter(p => (
      p.roleName === roleName
      && p.participantId === participantId
    ));
    const pTrips = players.map(p => trips.find(t => p.tripId === t.id));
    return _.every(pTrips, t => t.isArchived);
  }

  let roleTitle = 'Participants';
  let roleLabel = roleTitle;

  const path = history.location.pathname;
  const pathRoleMatch = path.match(/\/role\/([\w_-]+)\/(\d+)/);
  const pathRoleName = pathRoleMatch ? pathRoleMatch[1] : null;
  const pathParticipantId = pathRoleMatch ? pathRoleMatch[2] : null;

  if (pathRoleName && pathParticipantId) {
    const role = _.find(script.content.roles, { name: pathRoleName });
    const pathParticipant = pathParticipantId !== '0'
      ? _.find(allParticipants, { id: Number(pathParticipantId) }) : null;
    const participantName = pathParticipant ? pathParticipant.name : '';
    const participantSuffix = participantName ? ` (${participantName})` : '';
    const isArchived = isParticipantArchived(pathParticipant, pathRoleName);
    roleTitle = `Participant: ${role.title}${participantSuffix}`;
    roleLabel = (
      <span>
        {roleTitle}
        {isArchived ? archivedIcon : null}
      </span>
    );
  }

  const pathTripMatch = path.match(/\/trip\/(\d+)/);
  const pathTripId = pathTripMatch ? pathTripMatch[1] : null;
  const tripsItem = renderTripsItem(org, experience, trips, pathTripId);

  function itemsForRole(role) {
    const participants = _(allPlayers)
      .filter(player => player.role && player.role.interface)
      .filter({ roleName: role.name })
      .map('participant')
      .uniq()
      .value();

    return _(participants)
      .sortBy(p => [isParticipantArchived(p, role.name), p && p.name])
      .map((participant) => {
        const isArchived = isParticipantArchived(participant, role.name);
        const title = `${role.title} (${participant ? participant.name : 'No user'})`;
        return {
          url: (
            `/${org.name}/${experience.name}`
            + `/operate/role/${role.name}/${participant ? participant.id : 0}`
          ),
          label: (
            <span className={isArchived ? 'faint' : ''}>
              {title}
              {isArchived ? archivedIcon : null}
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
    text: 'Active runs',
    isExact: true,
    url: `/${org.name}/${experience.name}/operate`
  }, {
    text: roleTitle,
    label: roleLabel,
    url: `/${org.name}/${experience.name}/operate/role`,
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
      url: `/${org.name}/${experience.name}/operate/messages`
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
              .tz(experience.timezone)
              .format('h:mm:ssa')}
          </span>
          Upcoming
        </span>
      ),
      url: `/${org.name}/${experience.name}/operate/upcoming`
    });
  }

  return (
    <div>
      <ResponsiveTabs items={items} history={history} />
      {children}
    </div>
  );
}

ActiveTripsAll.propTypes = {
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired,
  nextUnappliedAction: PropTypes.object,
  numMessagesNeedingReply: PropTypes.number.isRequired
};

ActiveTripsAll.defaultProps = {
  nextUnappliedAction: null
};
