import React from 'react';
import PropTypes from 'prop-types';

function AppComponent({ match }) {
  const tripId = match.params.tripId;
  const playerId = match.params.playerId;
  console.log(`trip ${tripId} player ${playerId}`);
  return (
    <div>
      App
    </div>
  );
}

AppComponent.propTypes = {
  match: PropTypes.object.isRequired
};

export default AppComponent;
