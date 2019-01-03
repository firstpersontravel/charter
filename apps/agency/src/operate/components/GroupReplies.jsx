import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

function renderMessage(organizationName, message, trip, updateInstance) {
  return (
    <Message
      key={message.id}
      message={message}
      updateInstance={updateInstance}
      organizationName={organizationName}
      trip={trip} />
  );
}

export default function GroupReplies({ params, groupStatus,
  messagesNeedingReply, updateInstance }) {
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
      return renderMessage(params.organizationName, message, trip, updateInstance);
    })
    .value();
  return (
    <div>
      {renderedMessages}
    </div>
  );
}

GroupReplies.propTypes = {
  params: PropTypes.object.isRequired,
  groupStatus: PropTypes.object.isRequired,
  messagesNeedingReply: PropTypes.array.isRequired,
  updateInstance: PropTypes.func.isRequired
};
