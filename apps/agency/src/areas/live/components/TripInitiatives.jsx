import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { EvalCore, TextCore } from 'fptcore';

function renderCompletedInitiativeStatus(trip, initiative) {
  if (initiative.type === 'choice') {
    const value = EvalCore.lookupRef(trip.context, initiative.test);
    const statusTitle = initiative.titles[value];
    return statusTitle || 'Unknown value';
  }
  if (initiative.type === 'completion') {
    const isPassed = EvalCore.if(trip.context, initiative.test);
    const statusClass = isPassed ? 'text-success' : 'text-danger';
    const statusTitle = (
      isPassed ? initiative.titles.true : initiative.titles.false
    );
    return <span className={statusClass}>{statusTitle}</span>;
  }
  return null;
}

function renderInitiative(trip, initiative) {
  const sceneNames = _.map(trip.script.content.scenes, 'name');
  const indexOfCurrentScene = sceneNames.indexOf(trip.currentSceneName);
  const indexOfInitiativeScene = sceneNames.indexOf(initiative.scene);
  const initiativeScene = _.find(trip.script.content.scenes, {
    name: initiative.scene
  });
  const isCompleted = indexOfCurrentScene > indexOfInitiativeScene;
  const isInProgress = indexOfCurrentScene === indexOfInitiativeScene;
  const isPending = indexOfCurrentScene < indexOfInitiativeScene;
  const initiativeClass = isCompleted ? '' : 'faint';
  const status = isPending ? `Waiting for ${initiativeScene.title}` : (
    renderCompletedInitiativeStatus(trip, initiative)
  );
  const inProgress = isInProgress ? ' (scene in progress)' : '';
  return (
    <div key={initiative.name} className={initiativeClass}>
      <strong>{TextCore.titleForTypedKey(initiative.name)}:</strong>
      &nbsp;{status}{inProgress}
    </div>
  );
}

function renderInitiatives(trip, initiatives) {
  return initiatives.map(initiative => (
    renderInitiative(trip, initiative)
  ));
}

export default function TripInitiatives({ trip }) {
  const initiativesRendered = renderInitiatives(trip,
    trip.script.content.initiatives || []);
  return (
    <div>{initiativesRendered}</div>
  );
}

TripInitiatives.propTypes = {
  trip: PropTypes.object.isRequired
};
