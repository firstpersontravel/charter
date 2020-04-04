import React from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router';

function getRedirect(trip) {
  const firstSceneName = trip.script.content.scenes[0].name;
  const onFirstScene = (
    trip.tripState.currentSceneName === firstSceneName ||
    trip.tripState.currentSceneName === ''
  );
  if (onFirstScene) {
    return (
      `/${trip.org.name}/${trip.experience.name}` +
      `/operate/${trip.groupId}` +
      `/trip/${trip.id}/values`
    );
  }
  return (
    `/${trip.org.name}/${trip.experience.name}` +
    `/operate/${trip.groupId}` +
    `/trip/${trip.id}/scenes`
  );
}

export default function TripIndex({ trip }) {
  return <Redirect to={getRedirect(trip)} />;
}

TripIndex.propTypes = {
  trip: PropTypes.object.isRequired
};
