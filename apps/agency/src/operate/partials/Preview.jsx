import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Evaluator, Registry, TemplateUtil } from 'fptcore';

import { urlForResource } from '../../design/utils/section-utils';

const evaluator = new Evaluator(Registry);

function renderQr(trip, player, page, panel) {
  const qrCode = _.find(trip.script.content.qr_codes, { name: panel.qr_code });
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

function renderText(trip, player, page, panel) {
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

function renderButton(trip, player, page, panel) {
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

const panelRenderers = {
  qr_display: renderQr,
  text: renderText,
  yesno: renderText,
  button: renderButton
};

function renderPanel(trip, player, page, panel) {
  const renderer = panelRenderers[panel.type];
  if (!renderer) {
    return (
      <p className="card-text">[{panel.type}]</p>
    );
  }
  return renderer(trip, player, page, panel);
}

export function renderHeader(trip, player, page) {
  const headerText = page.directive ?
    TemplateUtil.templateText(trip.evalContext, page.directive,
      trip.experience.timezone) : page.title;
  const designLink = trip.script.org && trip.script.experience ? (
    <a
      className="ml-1"
      href={urlForResource(trip.script, 'pages', page.name)}>
      <i className="fa fa-pencil" />
    </a>
  ) : null;
  return (
    <span>
      <strong>{player.role.title}</strong>
      &nbsp;
      {headerText}
      {designLink}
    </span>
  );
}
function isPanelVisible(trip, player, panel) {
  return evaluator.if(trip.actionContext, panel.visible_if);
}

export function renderPage(trip, player, page) {
  const panels = page.panels || [];
  const visiblePanels = panels.filter(panel => (
    isPanelVisible(trip, player, panel)
  ));
  if (!visiblePanels.length) {
    return (
      <em>No content</em>
    );
  }
  return visiblePanels.map(panel => (
    <div key={`${page.name}-${panel.type}-${panel.text || ''}`}>
      {renderPanel(trip, player, page, panel)}
    </div>
  ));
}

export default function Preview({ trip, player, page }) {
  if (!page) {
    return null;
  }
  return (
    <div className="card mb-2">
      <div className="card-header">
        {renderHeader(trip, player, page)}
      </div>
      <div className="card-body">
        {renderPage(trip, player, page)}
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
