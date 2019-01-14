import React from 'react';
import PropTypes from 'prop-types';

import Message from '../partials/Message';

export default function GroupReplies({ group, messages, updateInstance }) {
  if (!messages.length) {
    return (
      <div className="alert alert-info">No messages.</div>
    );
  }
  const renderedMessages = messages.map(message => (
    <Message
      key={message.id}
      message={message}
      updateInstance={updateInstance} />
  ));
  return (
    <div>
      {renderedMessages}
    </div>
  );
}

GroupReplies.propTypes = {
  group: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  updateInstance: PropTypes.func.isRequired
};
