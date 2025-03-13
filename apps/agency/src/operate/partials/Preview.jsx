import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { coreEvaluator, TemplateUtil } from 'fptcore';

import { urlForResource } from '../../design/utils/section-utils';
import { fullMediaUrl } from '../utils';

function truncateMsg(msg, maxLength) {
  return msg.length > maxLength ? `${msg.slice(0, maxLength)}...` : msg;
}

function isBtnDisabled(trip, player, page) {
  // Btn only enabled if scene is active.
  if (page.scene !== trip.tripState.currentSceneName) {
    return true;
  }
  // Btn only enabled if page is current page.
  const currentPageNamesByRole = trip.tripState.currentPageNamesByRole || {};
  const curPageName = currentPageNamesByRole[player.roleName];
  if (page.name !== curPageName) {
    return true;
  }
  return false;
}

function renderText(trip, player, page, panel) {
  const maxLength = 80;
  let humanized = TemplateUtil.templateText(trip.evalContext,
    panel.text, trip.experience.timezone, player.roleName);
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
  const url = fullMediaUrl(trip.org, trip.experience, panel.image);
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
    panel.text || panel.placeholder, trip.experience.timezone,
    player.roleName);
  const btnEvent = { type: 'button_pressed', button_id: panel.id };
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => onEvent && onEvent(btnEvent, player.id)}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panelText}
    </button>
  );
}

function matchTriggerEvent(triggerEvent, eventSpecFields) {
  if (!triggerEvent) {
    return false;
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const [k, v] of Object.entries(eventSpecFields)) {
    if (!triggerEvent[k] || triggerEvent[k] !== v) {
      return false;
    }
  }
  return true;
}

function checkForTrigger(scriptContent, eventSpecFields) {
  return (scriptContent.triggers || [])
    .filter(trigger => matchTriggerEvent(trigger.event, eventSpecFields))
    .length > 0;
}

function renderDirections(trip, player, page, panel, onEvent) {
  const filter = { type: 'directions_arrived', directions: panel.id };
  if (!checkForTrigger(trip.script.content, filter)) {
    return null;
  }
  const destinationName = panel.destination_name || 'destination';
  const panelText = `Arrived at ${destinationName}`;
  const btnEvent = {
    type: 'directions_arrived',
    role_name: player.roleName,
    directions_id: panel.id
  };
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => onEvent && onEvent(btnEvent, player.id)}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panelText}
    </button>
  );
}

function renderNumberpad(trip, player, page, panel, onEvent) {
  const filter = { type: 'numberpad_submitted', numberpad: panel.id };
  if (!checkForTrigger(trip.script.content, filter)) {
    return null;
  }
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => {
        if (!onEvent) {
          return;
        }
        // eslint-disable-next-line no-alert
        const submission = prompt(
          `What entry for numberpad with placeholder "${panel.placeholder}"?`
        );
        if (!submission) {
          return;
        }
        onEvent({
          type: 'numberpad_submitted',
          numberpad_id: panel.id,
          submission: submission
        }, player.id);
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panel.placeholder || 'Enter text'}
    </button>
  );
}

function renderTextEntry(trip, player, page, panel, onEvent) {
  const filter = { type: 'text_entry_submitted', text_entry: panel.id };
  if (!checkForTrigger(trip.script.content, filter)) {
    return null;
  }
  return (
    <button
      className="btn btn-block constrain-text btn-outline-secondary mb-2"
      onClick={() => {
        if (!onEvent) {
          return;
        }
        // eslint-disable-next-line no-alert
        const submission = prompt(
          `What entry for input with placeholder "${panel.placeholder}"?`
        );
        if (!submission) {
          return;
        }
        onEvent({
          type: 'text_entry_submitted',
          text_entry_id: panel.id,
          submission: submission
        }, player.id);
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      {panel.placeholder || 'Enter number'}
    </button>
  );
}

function renderChoice(trip, player, page, panel, onEvent, onAction) {
  const choiceOptions = (panel.choices || []).map(choice => (
    <option value={choice.value} key={choice.value}>{choice.text}</option>
  ));
  return (
    <select
      className="form-control mb-2"
      value={_.get(trip.values, panel.value_ref) || ''}
      onChange={(e) => {
        if (!onEvent) {
          return;
        }
        onAction('set_value', {
          value_ref: panel.value_ref,
          new_value_ref: `"${e.target.value}"`
        }, player.id);
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      <option value="">{panel.text}</option>
      {choiceOptions}
    </select>
  );
}

function renderYesno(trip, player, page, panel, onEvent, onAction) {
  const val = _.get(trip.values, panel.value_ref);
  return (
    <select
      className="form-control mb-2"
      value={val === undefined ? '' : val}
      onChange={(e) => {
        if (!onEvent) {
          return;
        }
        onAction('set_value', {
          value_ref: panel.value_ref,
          new_value_ref: e.target.value
        }, player.id);
      }}
      disabled={isBtnDisabled(trip, player, page) || !onEvent}>
      <option value="">{panel.text}</option>
      <option value>Yes</option>
      <option value={false}>No</option>
    </select>
  );
}

const panelRenderers = {
  image: renderImage,
  text: renderText,
  yesno: renderYesno,
  choice: renderChoice,
  button: renderButton,
  directions: renderDirections,
  numberpad: renderNumberpad,
  text_entry: renderTextEntry
};

function renderPanel(trip, player, page, panel, onEvent, onAction) {
  const renderer = panelRenderers[panel.type];
  if (!renderer) {
    return (
      <p className="card-text text-center">
        <em>{panel.type}</em>
      </p>
    );
  }
  return renderer(trip, player, page, panel, onEvent, onAction);
}

function renderHeader(trip, player, page, onAction) {
  if (!page) {
    return 'No page';
  }
  const headerText = truncateMsg(_.trim(page.directive
    ? TemplateUtil.templateText(trip.evalContext, page.directive,
      trip.experience.timezone, player.roleName) : ''), 100);
  const header = headerText ? (<span className="ms-1">{headerText}</span>) : null;

  const currentPageNamesByRole = trip.tripState.currentPageNamesByRole || {};
  const curPageName = currentPageNamesByRole[player.roleName];
  const isCurrentScene = page.scene === trip.tripState.currentSceneName;
  const isCurrentPage = page.name === curPageName;
  const isAckedPage = player.acknowledgedPageName === page.name;

  const textClass = isCurrentPage ? 'text-white' : 'text-dark';
  const designLink = trip.script.org && trip.script.experience ? (
    <Link
      className={`ms-1 ${textClass}`}
      to={urlForResource(trip.script, 'pages', page.name)}>
      <i className="fa fa-pencil-alt" />
    </Link>
  ) : null;


  const isAckedIcon = isAckedPage ? (
    <span className={`ms-1 ${textClass}`}>
      <i className="fa fa-check" />
      {moment
        .utc(player.acknowledgedPageAt)
        .tz(trip.experience.timezone)
        .format('h:mma')}
    </span>
  ) : null;

  const showGoToPageBtn = onAction && isCurrentScene && !isCurrentPage;
  const goToPageButton = (showGoToPageBtn) ? (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <a
      style={{ cursor: 'pointer' }}
      onClick={() => onAction('send_to_page', {
        role_name: player.roleName,
        page_name: page.name
      }, player.id)}
      className="ms-1">
      <i className="fa fa-arrow-circle-right" />
    </a>
  ) : null;

  return (
    <span>
      <strong>{page.title}</strong>
      {header}
      {designLink}
      {isAckedIcon}
      {goToPageButton}
    </span>
  );
}
function isPanelVisible(trip, player, panel) {
  return coreEvaluator.if(trip.actionContext, panel.visible_if);
}

function renderPage(trip, player, page, onEvent, onAction) {
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
    <div key={`${page.name}-${panel.id}`}>
      {renderPanel(trip, player, page, panel, onEvent, onAction)}
    </div>
  ));
}

export default function Preview({
  trip, player, page, onEvent, onAction
}) {
  if (!page) {
    return null;
  }
  const isCurrentScene = page.scene === trip.tripState.currentSceneName;
  const currentPageNamesByRole = trip.tripState.currentPageNamesByRole || {};
  const curPageName = currentPageNamesByRole[player.roleName];
  const isCurrentPage = page.name === curPageName;
  const curCardClass = isCurrentScene ? 'border-primary' : 'border-secondary';
  const curHeadClass = isCurrentScene ? 'bg-primary' : 'bg-secondary';
  const cardClass = isCurrentPage ? curCardClass : '';
  const headerClass = isCurrentPage ? `${curHeadClass} text-white` : '';
  return (
    <div className={`card ${cardClass} mb-2`}>
      <div className={`card-header p-2 ${headerClass}`}>
        {renderHeader(trip, player, page, onAction)}
      </div>
      <div className="card-body p-2">
        {renderPage(trip, player, page, onEvent, onAction)}
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
