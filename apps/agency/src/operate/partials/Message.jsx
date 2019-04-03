import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

function renderMessageContent(message) {
  if (message.medium === 'image' && message.name) {
    return `[Image: ${TextUtil.titleForTypedKey(message.name)}]`;
  }
  if (message.medium === 'audio' && message.name) {
    return `[Audio: ${TextUtil.titleForTypedKey(message.name)}]`;
  }
  if (message.medium === 'image') {
    return (
      <img
        alt={message.content}
        className="img-fluid"
        src={message.content}
        style={{ maxHeight: '200px' }} />
    );
  }
  return message.content;
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
  } else if (message.name) {
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

export default function Message({ message, updateInstance, isInTripContext,
  isInRoleContext }) {
  if (!message.trip) {
    return null;
  }
  const trip = message.trip;
  const sentTo = message.sentTo;
  const sentBy = message.sentBy;
  const userPlayer = sentBy.role.actor ? sentTo : sentBy;
  const actorPlayer = userPlayer === sentBy ? sentTo : sentBy;
  const createdAt = moment.utc(message.createdAt);
  const timeFormat = 'ddd h:mma';
  const timeShort = createdAt.tz(trip.experience.timezone).format(timeFormat);
  const content = renderMessageContent(message);
  const icon = renderMessageIcon(message, sentBy, sentTo);
  const archivedClass = message.isArchived ? 'message-archived' : '';
  const shouldShowRespond = !message.sentTo.role.user &&
    !message.reponseReceivedAt;
  const respondBtn = shouldShowRespond ? (
    <Link
      className="btn btn-xs btn-outline-secondary"
      to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${actorPlayer.roleName}/messages/${userPlayer.roleName}`}>
      Respond to {userPlayer.role.title}
    </Link>
  ) : null;

  const tripPrefix = (
    <Link
      className="mr-1"
      to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}`}>
      {trip.departureName ? trip.departureName : trip.title}
    </Link>
  );

  const includeSentBy = true;
  const sentByLabel = (
    <span>
      <Link to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${sentBy.roleName}/messages/${sentTo.roleName}`}>
        {sentBy.role.title}
      </Link>
    </span>
  );

  const includeSentTo = !isInRoleContext;
  const sentToLabel = (
    <span>
      &nbsp;to <Link
        to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/players/${sentTo.roleName}/messages/${sentBy.roleName}`}>
        {sentTo.role.title}
      </Link>
    </span>
  );

  return (
    <div className={`message ${archivedClass}`}>
      {icon}
      {isInTripContext ? null : tripPrefix}
      {includeSentBy ? sentByLabel : null}
      {includeSentTo ? sentToLabel : null}:&nbsp;
      {content}
      &nbsp;
      <span className="faint">{timeShort}</span>
      &nbsp;
      {respondBtn}
      &nbsp;
      {renderActions(message, updateInstance)}
    </div>
  );
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
  updateInstance: PropTypes.func,
  isInTripContext: PropTypes.bool,
  isInRoleContext: PropTypes.string
};

Message.defaultProps = {
  updateInstance: null,
  isInTripContext: false,
  isInRoleContext: null
};
