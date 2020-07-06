import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { TextUtil } from 'fptcore';

import { fullMediaUrl } from '../utils';

function renderMessageContent(message) {
  if (message.medium === 'image' && message.name) {
    return `[Image: ${TextUtil.titleForTypedKey(message.name)}]`;
  }
  if (message.medium === 'audio' && message.name) {
    return `[Audio: ${TextUtil.titleForTypedKey(message.name)}]`;
  }
  if (message.medium === 'image') {
    const imageUrl = fullMediaUrl(message.trip.org, message.trip.experience,
      message.content);
    return (
      <img
        alt={message.content}
        className="img-fluid"
        src={imageUrl}
        style={{ maxHeight: '200px' }} />
    );
  }
  return message.content;
}

function renderMessageIcon(message) {
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
  } else if (message.isReplyNeeded) {
    icon = 'fa-user';
  } else {
    icon = 'fa-user-o';
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

export default function Message({ message, updateInstance }) {
  if (!message.trip) {
    return null;
  }
  const trip = message.trip;
  const roles = trip.script.content.roles || [];
  const toRole = roles.find(r => r.name === message.toRoleName);
  const fromRole = roles.find(r => r.name === message.fromRoleName);
  if (!fromRole || !toRole) {
    return null;
  }
  const userRole = message.isReplyNeeded ? fromRole : toRole;
  const actorRole = message.isReplyNeeded ? toRole : fromRole;
  const createdAt = moment.utc(message.createdAt);
  const timeFormat = 'ddd h:mma';
  const timeShort = createdAt.tz(trip.experience.timezone).format(timeFormat);
  const content = renderMessageContent(message);
  const icon = renderMessageIcon(message);
  const archivedClass = message.isArchived ? 'message-archived' : '';
  const shouldShowRespond = message.isReplyNeeded &&
    !message.reponseReceivedAt;
  const respondBtn = shouldShowRespond ? (
    <Link
      className="btn btn-xs btn-outline-secondary"
      to={`/${trip.org.name}/${trip.experience.name}/operate/${trip.groupId}/trip/${trip.id}/messages?for=${actorRole.name}&with=${userRole.name}`}>
      Respond to {userRole.title}
    </Link>
  ) : null;

  return (
    <div className={`message ${archivedClass}`}>
      {icon}
      <strong className="mr-1">{fromRole.title}:</strong>
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
  updateInstance: PropTypes.func
};

Message.defaultProps = {
  updateInstance: null
};
