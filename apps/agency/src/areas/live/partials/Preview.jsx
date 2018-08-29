import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';

import { EvalCore } from 'fptcore';

function renderPanel(participant, panel) {
  if (panel.if && !EvalCore.if(participant.trip.context, panel.if)) {
    return null;
  }
  if (panel.type === 'text' ||
      panel.type === 'yesno') {
    const humanized = EvalCore.templateText(participant.trip.context,
      panel.text, participant.trip.script.timezone);
    return humanized.split('\n').filter(Boolean).map(p => (
      <p key={p} style={{ marginBottom: '0.5em' }} className="card-text">
        {p}
      </p>
    ));
  }
  if (panel.type === 'button' ||
      panel.type === 'numberpad') {
    const panelText = EvalCore.templateText(
      participant.trip.context, panel.text || panel.placeholder,
      participant.trip.script.timezone);
    return (
      <button
        style={{ marginBottom: '0.5rem' }}
        className="btn btn-block constrain-text btn-outline-secondary"
        disabled>
        {panelText}
      </button>
    );
  }
  return (
    <p className="card-text">[{panel.type}]</p>
  );
}

function renderPageNotActive(pageset, participant) {
  const trip = participant.trip;
  const pagesetStart = pageset.start_ref ?
    moment.utc(EvalCore.lookupRef(trip.context, pageset.start_ref)) :
    null;
  const startLabel = pagesetStart ? ` - ${pagesetStart.clone().tz(trip.script.timezone).format('h:mma')}` : '';
  const introText = EvalCore.templateText(trip.context,
    pageset.intro, trip.script.timezone);
  return (
    <div className="card" style={{ marginBottom: '0.5em' }}>
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title} as {participant.roleName}
        </strong>
        &nbsp;
        {pageset.title} {startLabel}
      </div>
      <div className="card-body">
        <p className="card-text">{introText}</p>
        <button className="btn btn-block constrain-text btn-outline-secondary" disabled>
          {pageset.disabled_message}
        </button>
      </div>
    </div>
  );
}

function renderPage(pageset, page, participant) {
  const trip = participant.trip;
  const panels = page.panels || [];
  let headerPanel = null;
  if (page.directive) {
    const headerText = EvalCore.templateText(trip.context,
      page.directive, trip.script.timezone);
    headerPanel = (
      <div className="card-header">
        <strong>
          {trip.departureName} {trip.title} as {participant.roleName}
        </strong>
        &nbsp;
        {headerText}
      </div>
    );
  }
  const panelsRendered = panels
    .map(panel => (
      <div key={`${page.name}-${panel.type}-${panel.text || ''}`}>
        {renderPanel(participant, panel)}
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

export default function Preview({ participant }) {
  const trip = participant.trip;
  const script = trip.script;
  const page = _.find(script.content.pages,
    { name: participant.currentPageName });
  if (!page) {
    return null;
  }
  const pageset = _.find(script.content.pagesets,
    { name: page.pageset });
  const pagesetIsActive = (
    !pageset ||
    !pageset.if ||
    EvalCore.if(trip.context, pageset.if)
  );
  if (!pagesetIsActive) {
    return renderPageNotActive(pageset, participant);
  }
  return renderPage(pageset, page, participant);
}

Preview.propTypes = {
  participant: PropTypes.object.isRequired
};
