import React, { useState } from 'react';
import PropTypes from 'prop-types';

import MessagesThreadPanel from './messages-thread';

export default function MessagesBrowsePanel({
  panel, evaluator, fireEvent, postAction
}) {
  const asRoleName = panel.as || evaluator.getPlayer().roleName;

  const messagesWithSelf = evaluator.getMessages(asRoleName);
  const messagesWithRoleNames = [...new Set(messagesWithSelf
    .map(m => (m.fromRoleName === asRoleName ? m.toRoleName : m.fromRoleName)))];
  const messagesWithRoles = messagesWithRoleNames
    .map(roleName => evaluator.getScriptContent().roles.find(r => r.name === roleName));

  const defaultContactName = messagesWithRoleNames.length > 0 ? messagesWithRoleNames[0] : null;
  const [selectedContactName, setSelectedContactName] = useState(defaultContactName);

  const renderedContacts = messagesWithRoles.map(role => (
    <li
      key={role.name}
      className={
        `pure-menu-item ${role.name === selectedContactName ? 'pure-menu-selected' : ''}`
      }>
      <a onClick={() => setSelectedContactName(role.name)} className="pure-menu-link">
        {role.title}
      </a>
    </li>
  ));

  return (
    <div>
      <div className="page-panel-messages-browse pure-g">
        <div className="messages-list pure-u-1-4 pure-u-sm-1-4">
          <div className="pure-menu">
            <div className="pure-menu-heading">{panel.title}</div>
            <ul className="pure-menu-list">
              {renderedContacts}
            </ul>
          </div>
        </div>
        <div className="messages-detail pure-u-3-4 pure-u-sm-3-4 scrollable">
          <div className="messages-detail-inner">
            <MessagesThreadPanel
              panel={{
                as: asRoleName,
                with: selectedContactName
              }}
              evaluator={evaluator}
              fireEvent={fireEvent}
              postAction={postAction} />
          </div>
        </div>
      </div>
    </div>
  );
}

MessagesBrowsePanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired
};
