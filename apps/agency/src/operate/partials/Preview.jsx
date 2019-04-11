import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { ConditionCore, EvalCore } from 'fptcore';

function renderPanel(player, page, panel) {
  if (!ConditionCore.if(player.trip.evalContext, panel.active_if)) {
    return null;
  }
  if (panel.type === 'text' ||
      panel.type === 'yesno') {
    const humanized = EvalCore.templateText(player.trip.evalContext,
      panel.text, player.trip.experience.timezone);
    return humanized.split('\n').filter(Boolean).map(p => (
      <p key={p} className="card-text mb-2">
        {p}
      </p>
    ));
  }
  if (panel.type === 'button' ||
      panel.type === 'numberpad') {
    const isSceneActive = page.scene === player.trip.currentSceneName;
    const script = player.trip.script;
    const panelText = EvalCore.templateText(player.trip.evalContext,
      panel.text || panel.placeholder, player.trip.experience.timezone);
    const scene = _.find(script.content.scenes, { name: page.scene });
    const disabledPanelText = (
      <span>
        <span style={{ textDecoration: 'line-through' }}>{panelText}</span>
        &nbsp;
        (Waiting for scene &quot;{scene.title}&quot;)
      </span>
    );
    const panelContent = isSceneActive ? panelText : disabledPanelText;
    return (
      <button
        style={{ whiteSpace: 'initial' }}
        className="btn btn-block constrain-text btn-outline-secondary mb-2"
        disabled>
        {panelContent}
      </button>
    );
  }
  return (
    <p className="card-text">[{panel.type}]</p>
  );
}

const archivedIcon = (
  <i className="fa fa-archive ml-1" />
);

function renderPage(page, player) {
  const trip = player.trip;
  const tripArchivedLabel = trip.isArchived ? archivedIcon : null;
  const panels = page.panels || [];
  let headerPanel = null;
  if (page.directive) {
    const headerText = EvalCore.templateText(trip.evalContext,
      page.directive, trip.experience.timezone);
    headerPanel = (
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title}{tripArchivedLabel} as {player.roleName}
        </strong>
        &nbsp;
        {headerText}
      </div>
    );
  }
  const panelsRendered = panels
    .map(panel => (
      <div key={`${page.name}-${panel.type}-${panel.text || ''}`}>
        {renderPanel(player, page, panel)}
      </div>
    ));
  return (
    <div className="card mb-2">
      {headerPanel}
      <div className="card-body">
        {panelsRendered}
      </div>
    </div>
  );
}

export default function Preview({ player }) {
  const trip = player.trip;
  const script = trip.script;
  const page = _.find(script.content.pages,
    { name: player.currentPageName });
  if (!page) {
    return null;
  }
  return renderPage(page, player);
}

Preview.propTypes = {
  player: PropTypes.object.isRequired
};
