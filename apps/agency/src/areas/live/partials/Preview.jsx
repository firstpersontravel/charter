import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';

import { EvalCore } from 'fptcore';

function renderPanel(player, page, panel) {
  if (panel.if && !EvalCore.if(player.trip.context, panel.if)) {
    return null;
  }
  if (panel.type === 'text' ||
      panel.type === 'yesno') {
    const humanized = EvalCore.templateText(player.trip.context,
      panel.text, player.trip.script.timezone);
    return humanized.split('\n').filter(Boolean).map(p => (
      <p key={p} style={{ marginBottom: '0.5em' }} className="card-text">
        {p}
      </p>
    ));
  }
  if (panel.type === 'button' ||
      panel.type === 'numberpad') {
    const isSceneActive = page.scene === player.trip.currentSceneName;
    const script = player.trip.script;
    const panelText = EvalCore.templateText(player.trip.context,
      panel.text || panel.placeholder, script.timezone);
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
        style={{ marginBottom: '0.5rem', whiteSpace: 'initial' }}
        className="btn btn-block constrain-text btn-outline-secondary"
        disabled>
        {panelContent}
      </button>
    );
  }
  return (
    <p className="card-text">[{panel.type}]</p>
  );
}

function renderPageNotActive(appearance, player) {
  const trip = player.trip;
  const appearanceStart = appearance.start ?
    moment.utc(trip.schedule[appearance.start]) :
    null;
  const startLabel = appearanceStart ? ` - ${appearanceStart.clone().tz(trip.script.timezone).format('h:mma')}` : '';
  const introText = EvalCore.templateText(trip.context,
    appearance.intro, trip.script.timezone);
  return (
    <div className="card" style={{ marginBottom: '0.5em' }}>
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title} as {player.roleName}
        </strong>
        &nbsp;
        {appearance.title} {startLabel}
      </div>
      <div className="card-body">
        <p className="card-text">{introText}</p>
        <button className="btn btn-block constrain-text btn-outline-secondary" disabled>
          {appearance.disabled_message}
        </button>
      </div>
    </div>
  );
}

function renderPage(appearance, page, player) {
  const trip = player.trip;
  const panels = page.panels || [];
  let headerPanel = null;
  if (page.directive) {
    const headerText = EvalCore.templateText(trip.context,
      page.directive, trip.script.timezone);
    headerPanel = (
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title} as {player.roleName}
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
    <div className="card" style={{ marginBottom: '0.5em' }}>
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
  const appearance = _.find(script.content.appearances,
    { name: page.appearance });
  const appearanceIsActive = (
    !appearance ||
    !appearance.if ||
    EvalCore.if(trip.context, appearance.if)
  );
  if (!appearanceIsActive) {
    return renderPageNotActive(appearance, player);
  }
  return renderPage(appearance, page, player);
}

Preview.propTypes = {
  player: PropTypes.object.isRequired
};
