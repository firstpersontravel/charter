import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Evaluator, Registry, TemplateUtil } from 'fptcore';

const evaluator = new Evaluator(Registry);

function renderPanel(player, page, panel) {
  const script = player.trip.script;
  if (!evaluator.if(player.trip.actionContext, panel.visible_if)) {
    return null;
  }
  if (panel.type === 'qr_display') {
    const qrCode = _.find(script.content.qr_codes, { name: panel.qr_code });
    const redirectParams = {
      e: player.trip.experience.id || 0,
      r: page.role || player.roleName,
      c: qrCode.cue || '',
      p: qrCode.page || ''
    };
    const queryString = Object
      .keys(redirectParams)
      .map(key => `${key}=${encodeURIComponent(redirectParams[key])}`)
      .join('&');
    const redirectUrl = `${window.location.origin}/r?${queryString}`;
    const qrParams = {
      cht: 'qr',
      chs: '500x500',
      ch1: redirectUrl
    };
    const qrString = Object
      .keys(qrParams)
      .map(key => `${key}=${encodeURIComponent(qrParams[key])}`)
      .join('&');
    const qrUrl = `https://chart.googleapis.com/chart?${qrString}`;
    return (
      <img
        className="img-fluid"
        src={qrUrl}
        alt="QR code" />
    );
  }
  if (panel.type === 'text' ||
      panel.type === 'yesno') {
    const humanized = TemplateUtil.templateText(player.trip.evalContext,
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
    const panelText = TemplateUtil.templateText(player.trip.evalContext,
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

export default function Preview({ player, page }) {
  if (!page) {
    return null;
  }
  const trip = player.trip;
  const tripArchivedLabel = trip.isArchived ? archivedIcon : null;
  const panels = page.panels || [];
  let headerPanel = null;
  if (page.directive) {
    const headerText = TemplateUtil.templateText(trip.evalContext,
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

Preview.propTypes = {
  player: PropTypes.object.isRequired,
  page: PropTypes.object
};

Preview.defaultProps = {
  page: null
};
