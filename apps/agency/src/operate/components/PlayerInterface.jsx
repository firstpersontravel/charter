import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

function getIframeUrl(player) {
  const trip = player.trip;
  const user = player.user;
  const role = _.find(player.trip.script.content.roles,
    { name: player.roleName });
  if (role.type === 'performer' || !user) {
    return `/actor/player/${player.id}?nogps=1&noack=1`;
  }
  return `/travel/u/${user.id}/p/${trip.id}/role/${player.roleName}?debug=true&nogps=true&mute=true&noack=true`;
}

export default function PlayerInterface({ player }) {
  if (!player.currentPageName) {
    return <div>No interface</div>;
  }
  const iframeUrl = getIframeUrl(player);
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
  player: PropTypes.object.isRequired
};
