import React from 'react';
import PropTypes from 'prop-types';

function getIframeUrl(players, user) {
  if (!players.length) {
    return null;
  }
  const player = players[0];
  if (player.role.type === 'performer') {
    return user ? `/actor/${user.id}?nogps=1&noack=1` : null;
  }
  return `/travel/u/${user.id}/p/${player.trip.id}/role/${player.roleName}?debug=true&nogps=true&mute=true&noack=true`;
}

export default function RoleInterface({ players, user }) {
  const iframeUrl = getIframeUrl(players, user);
  if (!iframeUrl) {
    return <div>No interface.</div>;
  }
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

RoleInterface.propTypes = {
  players: PropTypes.array.isRequired,
  user: PropTypes.object
};

RoleInterface.defaultProps = {
  user: null
};
