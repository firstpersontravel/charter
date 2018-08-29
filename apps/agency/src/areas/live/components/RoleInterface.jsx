import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

function getIframeUrl(groupStatus, roleName, user) {
  const role = _.find(groupStatus.instance.script.content.roles,
    { name: roleName });
  if (role.actor) {
    return user ? `/actor/${user.id}?nogps=1&noack=1` : null;
  }
  const participants = _(groupStatus.instance.trips)
    .map('participants')
    .flatten()
    .filter({ roleName: roleName })
    .value();
  if (!participants.length) {
    return null;
  }
  const participant = participants[0];
  return `/travel/u/${user.id}/p/${participant.trip.id}/role/${roleName}?debug=true&nogps=true&mute=true&noack=true`;
}

export default function RoleInterface({ groupStatus, roleName, user }) {
  if (!user || groupStatus.isLoading) {
    return <div>Loading</div>;
  }
  const iframeUrl = getIframeUrl(groupStatus, roleName, user);
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
  groupStatus: PropTypes.object.isRequired,
  roleName: PropTypes.string.isRequired,
  user: PropTypes.object
};

RoleInterface.defaultProps = {
  user: null
};
