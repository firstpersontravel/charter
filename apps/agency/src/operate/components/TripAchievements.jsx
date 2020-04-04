import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';

import { Evaluator, TemplateUtil, Registry } from 'fptcore';

const evaluator = new Evaluator(Registry);

function renderCompletedAchievementStatus(trip, achievement) {
  console.log('achievement', achievement, trip.evalContext);
  if (achievement.style === 'choice') {
    const value = TemplateUtil.lookupRef(trip.evalContext, achievement.test);
    const statusTitle = achievement.titles[value];
    return statusTitle || 'Unknown value';
  }
  if (achievement.style === 'completion') {
    const isPassed = evaluator.if(trip.actionContext, achievement.test);
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
  const indexOfCurrentScene = sceneNames.indexOf(
    trip.tripState.currentSceneName);
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
      <strong>{achievement.title}:</strong>
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
    <div>
      <div>
        <strong>Values:</strong>
        <pre>{yaml.safeDump(trip.values)}</pre>
      </div>
      {achievementsRendered}
    </div>
  );
}

TripAchievements.propTypes = {
  trip: PropTypes.object.isRequired
};
