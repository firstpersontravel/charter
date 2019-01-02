import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

function renderMessage(message, trip, updateInstance) {
  return (
    <Message
      key={message.id}
      message={message}
      updateInstance={updateInstance}
      trip={trip} />
  );
}

export default function GroupReplies({ groupStatus, messagesNeedingReply, updateInstance }) {
  const trips = _.get(groupStatus, 'instance.trips') || [];
  if (!messagesNeedingReply.length) {
    return (
      <div className="alert alert-info">No messages needing reply!</div>
    );
  }
  const renderedMessages = _(messagesNeedingReply)
    .sortBy('createdAt')
    .reverse()
    .slice(0, 10)
    .map((message) => {
      const trip = _.find(trips, { id: message.tripId });
      return renderMessage(message, trip, updateInstance);
    })
    .value();
  return (
    <div>
      {renderedMessages}
    </div>
  );
}

GroupReplies.propTypes = {
  groupStatus: PropTypes.object.isRequired,
  messagesNeedingReply: PropTypes.array.isRequired,
  updateInstance: PropTypes.func.isRequired
};