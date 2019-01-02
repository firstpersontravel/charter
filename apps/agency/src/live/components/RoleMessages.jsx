import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

function renderMessages(trips, messages) {
  if (!messages.length) {
    return <div>No messages needing reply.</div>;
  }
  return _.sortBy(messages, 'createdAt')
    .reverse()
    .map(message => (
      <Message
        key={message.id}
        trip={_.find(trips, { id: message.tripId })}
        message={message} />
    ));
}

export default function RoleMessages({ params, groupStatus,
    messagesNeedingReply, user }) {
  const messages = renderMessages(
    groupStatus.instance.trips, messagesNeedingReply);
  const tripLinks = groupStatus.instance.trips.map((trip => (
    <li key={trip.id}>
      <Link to={`/agency/live/${trip.groupId}/trip/${trip.id}/players/${params.roleName}/messages`}>
        {trip.departureName} {trip.title}
      </Link>
    </li>
  )));
  return (
    <div>
      {messages}
      <br />
      To send a message, select a trip:
      <ul>
        {tripLinks}
      </ul>
    </div>
  );
}

RoleMessages.propTypes = {
  groupStatus: PropTypes.object.isRequired,
  user: PropTypes.object,
  messagesNeedingReply: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

RoleMessages.defaultProps = {
  user: null
};
