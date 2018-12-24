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
  if (!appearance || !appearance.start_ref) {
    return null;
  }
  return moment.utc(EvalCore.lookupRef(player.trip.context,
    appearance.start_ref));
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

function renderParticipantCell(participant, isFirst) {
  const trip = participant.trip;
  const page = _.find(participant.trip.script.content.pages,
    { name: participant.currentPageName });
  if (!page) {
    return null;
  }
  const appearance = _.find(trip.script.content.appearances, {
    name: page.appearance
  }) || {};
  const appearanceIsActive = !appearance.if || EvalCore.if(trip.context, appearance.if);
  const pageTitle = page ? page.title : participant.currentPageName;
  const status = appearanceIsActive ? pageTitle : appearance.disabled_message;
  const tripRoleUrl = `/agency/live/${trip.groupId}/trip/${trip.id}/participants/${participant.roleName}`;

  const renderedMap = isFirst ? renderMap(trip, participant.user) : null;
  const renderedUser = isFirst ? (
    <div>
      <strong>User:</strong> {renderUser(participant.user)}
    </div>
  ) : null;

  return (
    <div className="row" key={participant.id}>
      <div className="col-sm-6">
        <Preview participant={participant} />
      </div>
      <div className="col-sm-6">
        {renderedMap}
        {renderedUser}
        <p>
          <strong>Participant:</strong>
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

export default function RoleIndex({ user, participants }) {
  if (!participants.length) {
    return <div>Loading</div>;
  }
  const participantsSorted = _(participants)
    .filter('trip')
    .filter('currentPageName')
    .sortBy((player) => {
      const appearanceStart = getAppearanceStart(player);
      return appearanceStart ? appearanceStart.unix() : 0;
    })
    .value();
  if (!participantsSorted.length) {
    return <div>No participants</div>;
  }
  const renderedPlayers = participantsSorted.map((participant, i) => (
    renderParticipantCell(participant, i === 0)
  ));
  return (
    <div>
      {renderedPlayers}
    </div>
  );
}

RoleIndex.propTypes = {
  user: PropTypes.object,
  participants: PropTypes.array.isRequired
};
