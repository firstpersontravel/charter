import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

function getIframeUrl(participant) {
  const trip = participant.trip;
  const user = participant.user;
  const role = _.find(participant.trip.script.content.roles,
    { name: participant.roleName });
  if (role.actor) {
    return `/actor/participant/${participant.id}?nogps=1&noack=1`;
  }
  return `/travel/u/${user.id}/p/${trip.id}/role/${participant.roleName}?debug=true&nogps=true&mute=true&noack=true`;
}

export default function PlayerInterface({ participant }) {
  if (!participant.currentPageName) {
    return <div>No interface</div>;
  }
  const iframeUrl = getIframeUrl(participant);
  const iframeStyle = { width: '100%', height: '800px', border: 0 };
  return (
    <div>
      <div>
        <a href={iframeUrl} target="_blank" rel="noopener noreferrer">
          Open in new window
        </a>
      </div>
      <iframe src={iframeUrl} style={iframeStyle} />
    </div>
  );
}

PlayerInterface.propTypes = {
  participant: PropTypes.object.isRequired
};
