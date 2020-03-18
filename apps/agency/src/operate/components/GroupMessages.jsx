import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

function renderRoleMessages(trip, player, messages, updateInstance) {
  const renderedMessages = messages.map(message => (
    <Message
      key={message.id}
      message={message}
      updateInstance={updateInstance} />
  ));
  return (
    <div key={`${trip.id}-${player.id}`}>
      <h4>
        {trip.departureName}&nbsp;
        {trip.title}: {player.role.title}
      </h4>
      {renderedMessages}
    </div>
  );
}

function renderTripMessages(trip, messages, updateInstance) {
  return _(messages)
    .groupBy('sentToId')
    .map((roleMessages, sentToId) => (
      renderRoleMessages(trip, roleMessages[0].sentTo,
        roleMessages, updateInstance)
    ))
    .value();
}

export default function GroupMessages({ group, messages, updateInstance }) {
  if (!messages.length) {
    return (
      <div className="alert alert-info">No messages.</div>
    );
  }
  const renderedTrips = _(messages)
    .groupBy('tripId')
    .map((tripMessages, tripId) => (
      renderTripMessages(tripMessages[0].trip, tripMessages, updateInstance)
    ))
    .value();
  return (
    <div>
      {renderedTrips}
    </div>
  );
}

GroupMessages.propTypes = {
  group: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  updateInstance: PropTypes.func.isRequired
};
