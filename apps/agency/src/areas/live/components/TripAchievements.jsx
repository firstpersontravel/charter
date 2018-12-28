import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { EvalCore, TextCore } from 'fptcore';

function renderCompletedAchievementStatus(trip, achievement) {
  if (achievement.type === 'choice') {
    const value = EvalCore.lookupRef(trip.context, achievement.test);
    const statusTitle = achievement.titles[value];
    return statusTitle || 'Unknown value';
  }
  if (achievement.type === 'completion') {
    const isPassed = EvalCore.if(trip.context, achievement.test);
    const statusClass = isPassed ? 'text-success' : 'text-danger';
    const statusTitle = (
      isPassed ? achievement.titles.true : achievement.titles.false
    );
    return <span className={statusClass}>{statusTitle}</span>;
  }
  return null;
}

function renderAchievement(trip, achievement) {
  const sceneNames = _.map(trip.script.content.scenes, 'name');
  const indexOfCurrentScene = sceneNames.indexOf(trip.currentSceneName);
  const indexOfAchievementScene = sceneNames.indexOf(achievement.scene);
  const achievementScene = _.find(trip.script.content.scenes, {
    name: achievement.scene
  });
  const isCompleted = indexOfCurrentScene > indexOfAchievementScene;
  const isInProgress = indexOfCurrentScene === indexOfAchievementScene;
  const isPending = indexOfCurrentScene < indexOfAchievementScene;
  const achievementClass = isCompleted ? '' : 'faint';
  const status = isPending ? `Waiting for ${achievementScene.title}` : (
    renderCompletedAchievementStatus(trip, achievement)
  );
  const inProgress = isInProgress ? ' (scene in progress)' : '';
  return (
    <div key={achievement.name} className={achievementClass}>
      <strong>{TextCore.titleForTypedKey(achievement.name)}:</strong>
      &nbsp;{status}{inProgress}
    </div>
  );
}

function renderAchievements(trip, achievements) {
  return achievements.map(achievement => (
    renderAchievement(trip, achievement)
  ));
}

export default function TripAchievements({ trip }) {
  const achievementsRendered = renderAchievements(trip,
    trip.script.content.achievements || []);
  return (
    <div>{achievementsRendered}</div>
  );
}

TripAchievements.propTypes = {
  trip: PropTypes.object.isRequired
};
