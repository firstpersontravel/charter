import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { coreEvaluator, TemplateUtil } from 'fptcore';

import { urlForResource } from '../../design/utils/section-utils';
import { fullMediaUrl } from '../../operate/utils';

function truncateMsg(msg, maxLength) {
  return msg.length > maxLength ? `${msg.slice(0, maxLength)}...` : msg;
}

function isBtnDisabled(trip, player, page) {
  // Btn only enabled if scene is active.
  if (page.scene !== trip.tripState.currentSceneName) {
    return true;
  }
  // Btn only enabled if page is current page.
  const curPageName = trip.tripState.currentPageNamesByRole[player.roleName];
  if (page.name !== curPageName) {
    return true;
  }
  return false;
}

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

function renderImage(trip, player, page, panel) {
  const url = fullMediaUrl(trip.org, trip.experience, panel.path);
  return (
    <img
      alt={page.title}
      style={{ maxHeight: '100px', maxWidth: '100px' }}
      className="img-fluid"
      src={url} />
  );
}

function renderButton(trip, player, page, panel, onEvent) {
  const panelText = TemplateUtil.templateText(trip.evalContext,
    panel.text || panel.placeholder, trip.experience.timezone);
  const btnEvent = { type: 'button_pressed', button_id: panel.id };
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => onEvent && onEvent(btnEvent)}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panelText}
    </button>
  );
}

function renderDirections(trip, player, page, panel, onEvent) {
  const destinationName = panel.destination_name || 'destination';
  const panelText = `Arrived at ${destinationName}`;
  const btnEvent = { type: 'directions_arrived', directions_id: panel.id };
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => onEvent && onEvent(btnEvent)}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panelText}
    </button>
  );
}

function renderNumberpad(trip, player, page, panel, onEvent) {
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => {
        if (!onEvent) {
          return;
        }
        // eslint-disable-next-line no-alert
        const submission = prompt(
          `What entry for numberpad with placeholder "${panel.placeholder}"?`);
        if (!submission) {
          return;
        }
        onEvent({
          type: 'numberpad_submitted',
          numberpad_id: panel.id,
          submission: submission
        });
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panel.placeholder}
    </button>
  );
}

function renderTextEntry(trip, player, page, panel, onEvent) {
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => {
        if (!onEvent) {
          return;
        }
        // eslint-disable-next-line no-alert
        const submission = prompt(
          `What entry for input with placeholder "${panel.placeholder}"?`);
        if (!submission) {
          return;
        }
        onEvent({
          type: 'text_entry_submitted',
          text_entry_id: panel.id,
          submission: submission
        });
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panel.placeholder}
    </button>
  );
}

const panelRenderers = {
  qr_display: renderQr,
  image: renderImage,
  text: renderText,
  yesno: renderText,
  button: renderButton,
  directions: renderDirections,
  numberpad: renderNumberpad,
  text_entry: renderTextEntry
};

function renderPanel(trip, player, page, panel, onEvent) {
  const renderer = panelRenderers[panel.type];
  if (!renderer) {
    return (
      <p className="card-text text-center">
        <em>{panel.type}</em>
      </p>
    );
  }
  return renderer(trip, player, page, panel, onEvent);
}

function renderHeader(trip, player, page, onAction) {
  if (!page) {
    return 'No page';
  }
  const headerText = page.directive ?
    TemplateUtil.templateText(trip.evalContext, page.directive,
      trip.experience.timezone) : '';

  const curPageName = trip.tripState.currentPageNamesByRole[player.roleName];
  const isCurrentPage = page.name === curPageName;
  const isAckedPage = player.acknowledgedPageName === page.name;

  const textClass = isCurrentPage ? 'text-white' : 'text-dark';
  const designLink = trip.script.org && trip.script.experience ? (
    <Link
      className={`ml-1 ${textClass}`}
      to={urlForResource(trip.script, 'pages', page.name)}>
      <i className="fa fa-pencil" />
    </Link>
  ) : null;


  const isAckedIcon = isAckedPage ? (
    <span className={`ml-1 ${textClass}`}>
      <i className="fa fa-check" />
      {moment
        .utc(player.acknowledgedPageAt)
        .tz(trip.experience.timezone)
        .format('h:mma')}
    </span>
  ) : null;

  const goToPageButton = (onAction && !isCurrentPage) ? (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <a
      style={{ cursor: 'pointer' }}
      onClick={() => onAction('send_to_page', {
        role_name: player.roleName,
        page_name: page.name
      })}
      className="ml-1">
      <i className="fa fa-arrow-circle-right" />
    </a>
  ) : null;

  return (
    <span>
      <strong className="mr-1">{page.title}</strong>
      {truncateMsg(headerText, 100)}
      {designLink}
      {isAckedIcon}
      {goToPageButton}
    </span>
  );
}
function isPanelVisible(trip, player, panel) {
  return coreEvaluator.if(trip.actionContext, panel.visible_if);
}

function renderPage(trip, player, page, onEvent) {
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
      {renderPanel(trip, player, page, panel, onEvent)}
    </div>
  ));
}

export default function Preview({ trip, player, page, onEvent, onAction }) {
  if (!page) {
    return null;
  }
  const isCurrentScene = page.scene === trip.tripState.currentSceneName;
  const curPageName = trip.tripState.currentPageNamesByRole[player.roleName];
  const isCurrentPage = page.name === curPageName;
  const curCardClass = isCurrentScene ? 'border-primary' : 'border-secondary';
  const curHeadClass = isCurrentScene ? 'bg-primary' : 'bg-secondary';
  const cardClass = isCurrentPage ? curCardClass : '';
  const headerClass = isCurrentPage ? `${curHeadClass} text-white` : '';
  return (
    <div className={`card ${cardClass} mb-2`}>
      <div className={`card-header ${headerClass}`}>
        {renderHeader(trip, player, page, onAction)}
      </div>
      <div className="card-body">
        {renderPage(trip, player, page, onEvent)}
      </div>
    </div>
  );
}

Preview.propTypes = {
  trip: PropTypes.object.isRequired,
  player: PropTypes.object.isRequired,
  page: PropTypes.object,
  onAction: PropTypes.func,
  onEvent: PropTypes.func
};

Preview.defaultProps = {
  page: null,
  onEvent: null,
  onAction: null
};
