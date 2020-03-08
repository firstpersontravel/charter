import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Evaluator, Registry, TemplateUtil } from 'fptcore';

const evaluator = new Evaluator(Registry);

function renderPanel(trip, player, page, panel) {
  const script = trip.script;
  if (!evaluator.if(trip.actionContext, panel.visible_if)) {
    return null;
  }
  if (panel.type === 'qr_display') {
    const qrCode = _.find(script.content.qr_codes, { name: panel.qr_code });
    const redirectParams = {
      e: trip.experience.id || 0,
      r: qrCode.role,
      c: qrCode.cue || '',
      p: qrCode.page || ''
    };
    const queryString = Object
      .keys(redirectParams)
      .map(key => `${key}=${encodeURIComponent(redirectParams[key])}`)
      .join('&');
    const redirectUrl = `${window.location.origin}/r/?${queryString}`;
    const qrParams = {
      cht: 'qr',
      chs: '500x500',
      chl: redirectUrl
    };
    const qrString = Object
      .keys(qrParams)
      .map(key => `${key}=${encodeURIComponent(qrParams[key])}`)
      .join('&');
    const qrUrl = `https://chart.googleapis.com/chart?${qrString}`;
    return (
      <div>
        <img
          className="img-fluid"
          src={qrUrl}
          alt="QR code" />
        <a href={redirectUrl}>{redirectUrl}</a>
      </div>
    );
  }
  if (panel.type === 'text' ||
      panel.type === 'yesno') {
    const maxLength = 100;
    let humanized = TemplateUtil.templateText(trip.evalContext,
      panel.text, trip.experience.timezone);
    if (humanized.length > maxLength) {
      humanized = `${humanized.slice(0, maxLength)}...`;
    }
    return humanized.split('\n').filter(Boolean).map((p, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <p key={`${i}-${p}`} className="card-text mb-2">
        {p}
      </p>
    ));
  }
  if (panel.type === 'button' ||
      panel.type === 'numberpad') {
    const isSceneActive = page.scene === trip.currentSceneName;
    const panelText = TemplateUtil.templateText(trip.evalContext,
      panel.text || panel.placeholder, trip.experience.timezone);
    return (
      <button
        style={isSceneActive ? null : { textDecoration: 'line-through' }}
        className="btn btn-block constrain-text btn-outline-secondary mb-2"
        disabled>
        {panelText}
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

export default function Preview({ trip, player, page }) {
  if (!page) {
    return null;
  }
  const tripArchivedLabel = trip.isArchived ? archivedIcon : null;
  const panels = page.panels || [];
  let headerPanel = null;
  if (page.directive) {
    const headerText = TemplateUtil.templateText(trip.evalContext,
      page.directive, trip.experience.timezone);
    headerPanel = (
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title}{tripArchivedLabel} as {player.role.title}
        </strong>
        &nbsp;
        {headerText}
      </div>
    );
  }
  const panelsRendered = panels
    .map(panel => (
      <div key={`${page.name}-${panel.type}-${panel.text || ''}`}>
        {renderPanel(trip, player, page, panel)}
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
  trip: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  page: PropTypes.object
};

Preview.defaultProps = {
  page: null
};
