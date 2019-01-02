import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

function renderMessageContent(message) {
  if (message.messageType === 'image' && message.messageName) {
    return `[Image: ${TextUtil.titleForTypedKey(message.messageName)}]`;
  }
  if (message.messageType === 'audio' && message.messageName) {
    return `[Audio: ${TextUtil.titleForTypedKey(message.messageName)}]`;
  }
  if (message.messageType === 'image') {
    return (
      <img
        alt={message.messageContent}
        className="img-fluid"
        src={message.messageContent}
        style={{ maxHeight: '200px' }} />
    );
  }
  return message.messageContent;
}

function renderMessageIcon(message, sentBy, sentTo) {
  // Give a check to messages replied to within the last hour.
  const oneHourAgo = moment.utc().subtract(1, 'hour');
  let textClass = '';
  let icon = '';
  if (message.isReplyNeeded && message.replyReceivedAt &&
      moment.utc(message.replyReceivedAt).isAfter(oneHourAgo)) {
    textClass = 'text-success';
    icon = 'fa-check-circle';
  } else if (message.isReplyNeeded && !message.replyReceivedAt) {
    textClass = 'text-danger';
    icon = 'fa-exclamation-circle';
  } else if (message.messageName) {
    icon = 'fa-clock-o';
  } else if (sentBy.role.actor) {
    icon = 'fa-user-o';
  } else {
    icon = 'fa-user';
  }
  return (
    <span className={textClass}>
      <i className={`fa ${icon}`} />&nbsp;
    </span>
  );
}

function renderActions(message, updateInstance) {
  if (!updateInstance) {
    return null;
  }
  const archiveAction = (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className="faint"
      onClick={() => (
      updateInstance('messages', message.id, {
        isArchived: !message.isArchived
      })
    )}>
      <i className="fa fa-trash-o" />
    </span>
  );
  const isReplyNeeded = message.isReplyNeeded && !message.replyReceivedAt;
  const markRepliedAction = isReplyNeeded ? (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className="faint"
      onClick={() => (
      updateInstance('messages', message.id, {
        replyReceivedAt: moment.utc()
      })
    )}>
      <i className="fa fa-check" />
    </span>
  ) : null;
  return (
    <span>
      {archiveAction}{' '}
      {markRepliedAction}
    </span>
  );
}

export default function Message({ message, trip, updateInstance }) {
  if (!trip) {
    return null;
  }
  const sentBy = _.find(trip.players, { id: message.sentById });
  if (!sentBy) {
    return null;
  }
  const sentByRole = _.find(trip.script.content.roles,
    { name: sentBy.roleName });
  const sentTo = _.find(trip.players, { id: message.sentToId });
  const userPlayer = sentByRole.actor ? sentTo : sentBy;
  const actorPlayer = userPlayer === sentBy ? sentTo : sentBy;
  const createdAt = moment.utc(message.createdAt);
  const timeFormat = 'ddd h:mma';
  const timeShort = createdAt.tz(trip.experience.timezone).format(timeFormat);
  const messageContent = renderMessageContent(message);
  const icon = renderMessageIcon(message, sentBy, sentTo);
  const archivedClass = message.isArchived ? 'message-archived' : '';
  return (
    <div className={`message ${archivedClass}`}>
      {icon}
      <Link to={`/operate/${trip.groupId}/trip/${trip.id}/players/${userPlayer.roleName}/messages/${actorPlayer.roleName}`}>
        {trip.departureName}&nbsp;
        {sentBy.roleName}
      </Link>:&nbsp;
      {messageContent}
      &nbsp;
      <span className="faint">{timeShort}</span>
      &nbsp;
      {renderActions(message, updateInstance)}
    </div>
  );
}

Message.propTypes = {
  message: PropTypes.object,
  updateInstance: PropTypes.func,
  trip: PropTypes.object
};
