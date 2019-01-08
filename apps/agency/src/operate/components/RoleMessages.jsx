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

export default function RoleMessages({ params, group,
    messagesNeedingReply, user }) {
  const messages = renderMessages(
    group.trips, messagesNeedingReply);
  const tripLinks = group.trips.map((trip => (
    <li key={trip.id}>
      <Link to={`/${group.org.name}/${group.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${params.roleName}/messages`}>
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
  group: PropTypes.object.isRequired,
  user: PropTypes.object,
  messagesNeedingReply: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

RoleMessages.defaultProps = {
  user: null
};
