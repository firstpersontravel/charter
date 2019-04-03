import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

function renderMessages(trips, messages) {
  if (!messages.length) {
    return (
      <div className="alert alert-warning">
        No messages.
      </div>
    );
  }
  const renderedMessages = _.sortBy(messages, 'createdAt')
    .reverse()
    .map(message => (
      <Message
        key={message.id}
        message={message} />
    ));
  return (
    <div className="mb-3">
      {renderedMessages}
    </div>
  );
}

export default function RoleMessages({ params, group, messages, user }) {
  const renderedMessages = renderMessages(group.trips, messages);
  const tripLinks = group.trips.map((trip => (
    <li key={trip.id}>
      <Link to={`/${group.org.name}/${group.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${params.roleName}/messages`}>
        {trip.departureName ? `${trip.departureName} ` : ''}{trip.title}
      </Link>
    </li>
  )));
  return (
    <div>
      {renderedMessages}
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
  messages: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

RoleMessages.defaultProps = {
  user: null
};
