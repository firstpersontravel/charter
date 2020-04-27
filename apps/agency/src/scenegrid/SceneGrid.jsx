import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Popover,
  PopoverHeader,
  PopoverBody,
  Tooltip
} from 'reactstrap';

import { coreEvaluator, coreRegistry, coreWalker, TemplateUtil } from 'fptcore';

import Preview, {
  renderHeader,
  renderPage
} from '../operate/partials/Preview';
import ResourceBadge from '../partials/ResourceBadge';
import { sortForRole } from '../operate/utils';
import { getPlayerIframeUrl } from '../utils';

const promptsForTriggerEventTypes = {
  text_received: {
    prompt: 'What message?',
    getEvent: result => ({ message: { content: result } })
  },
  clip_answered: {
    prompt: 'What response?',
    getEvent: result => ({ response: result })
  }
};

export default class SceneGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openTriggerTooltipName: null,
      openPopoverPageName: null
    };
  }

  getPlayersForScene(scene) {
    const trip = this.props.trip;
    return _(trip.players)
      .filter(player => (
        coreEvaluator.if(trip.actionContext, player.role.active_if)
      ))
      .filter(player => (
        _.find(trip.script.content.pages, {
          interface: player.role.interface,
          scene: scene.name
        })
      ))
      .sortBy(player => sortForRole(player.role))
      .value();
  }

  handleAction(actionName, actionParams) {
    this.props.onAction(actionName, actionParams);
  }

  handleTrigger(trigger) {
    let event = null;
    // Special cases for triggers to enter the value
    if (trigger.event && promptsForTriggerEventTypes[trigger.event.type]) {
      const promptDef = promptsForTriggerEventTypes[trigger.event.type];
      // eslint-disable-next-line no-alert
      const res = prompt(promptDef.prompt);
      event = promptDef.getEvent(res);
    }
    this.props.onTrigger(trigger.name, event);
  }

  renderPlayerPage(player, page) {
    const trip = this.props.trip;
    const curPageName = trip.tripState.currentPageNamesByRole[player.roleName];
    const isCurrentPage = page.name === curPageName;
    const isAckedPage = player.acknowledgedPageName === page.name;
    const pageTitle = TemplateUtil.templateText(trip.evalContext, page.title,
      trip.experience.timezone);

    const goToPageButton = (!isCurrentPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        style={{ cursor: 'pointer', float: 'right' }}
        onClick={() => this.handleAction('send_to_page', {
          role_name: player.roleName,
          page_name: page.name
        })}
        className="ml-1">
        <i className="fa fa-arrow-circle-right" />
      </a>
    ) : null;

    const refreshButton = (isCurrentPage && !isAckedPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        className="ml-1"
        style={{ cursor: 'pointer', float: 'right' }}
        onClick={() => this.props.onAdminAction(
          trip.orgId, trip.experienceId, trip.id,
          'notify', { notify_type: 'refresh' }
        )}>
        <i className="fa fa-hand-right" />
      </a>
    ) : null;

    const isAckedIcon = isAckedPage ? (
      <span>
        &nbsp;
        <i className="fa fa-check" />
        {moment
          .utc(player.acknowledgedPageAt)
          .tz(trip.experience.timezone)
          .format('h:mma')}
      </span>
    ) : null;

    if (isCurrentPage) {
      return (
        <Preview
          key={page.name}
          trip={trip}
          player={player}
          page={page}
          onEvent={this.props.onEvent} />
      );
    }

    const playerPageName = `${player.id}-${page.name}`;
    const isPopoverOpen = this.state.openPopoverPageName === playerPageName;
    return (
      <div key={page.name}>
        {goToPageButton}
        <ResourceBadge
          resourceType="page"
          className="mr-1"
          showType={false} />
        {pageTitle}
        <span
          style={{ cursor: 'pointer' }}
          className="ml-1"
          id={`popover-page-${playerPageName}`}>
          <i className="fa fa-search" />
        </span>
        {refreshButton}
        {isAckedIcon}
        <Popover
          trigger="legacy"
          isOpen={isPopoverOpen}
          target={`popover-page-${playerPageName}`}
          toggle={() => {
            this.setState({
              openPopoverPageName: isPopoverOpen ? null : playerPageName
            });
          }}>
          <PopoverHeader>
            {renderHeader(trip, player, page)}
          </PopoverHeader>
          <PopoverBody>
            {renderPage(trip, player, page, this.props.onEvent)}
          </PopoverBody>
        </Popover>
      </div>
    );
  }

  renderScenePlayerColumn(scene, player, colWidth) {
    const trip = this.props.trip;
    const pages = _.filter(trip.script.content.pages, {
      interface: player.role.interface,
      scene: scene.name
    });
    const renderedPages = pages
      .map(page => this.renderPlayerPage(player, page));
    const iframeLink = trip.id ? (
      <a
        target="_blank"
        className="ml-1"
        rel="noopener noreferrer"
        href={getPlayerIframeUrl(trip, player)}>
        <i className="fa fa-link" />
      </a>
    ) : null;
    return (
      <div className={`col-sm-${colWidth} player-column`} key={player.id}>
        <h5 className="constrain-text">
          <ResourceBadge resourceType="role" className="mr-1" showType={false} />
          {player.role.title}
          {iframeLink}
        </h5>
        {renderedPages}
      </div>
    );
  }

  renderTriggerBtn(scene, trigger) {
    const trip = this.props.trip;
    const triggerResourceClass = coreRegistry.resources.trigger;
    const currentSceneName = this.props.trip.tripState.currentSceneName;
    const isCurrentScene = scene.name === currentSceneName;
    const isActiveGlobalScene = scene.global && (
      coreEvaluator.if(trip.actionContext, scene.active_if)
    );
    const hasBeenTriggered = !!trip.history[trigger.name];
    const canTrigger = isCurrentScene || isActiveGlobalScene;
    const style = {
      marginTop: 0,
      marginBottom: '0.25em',
      textDecoration: hasBeenTriggered ? 'line-through' : ''
    };
    const isTooltipOpen = this.state.openTriggerTooltipName === trigger.name;
    const btnTitle = triggerResourceClass.getEventTitle(trip.script.content,
      trigger, coreRegistry, coreWalker);
    return (
      <span key={trigger.name}>
        <button
          id={`trigger-btn-${trigger.name}`}
          disabled={!canTrigger}
          onClick={() => this.handleTrigger(trigger)}
          style={style}
          className="constrain-text btn btn-block btn-xs btn-outline-secondary">
          {btnTitle}
        </button>
        <Tooltip
          placement="top"
          isOpen={isTooltipOpen}
          target={`trigger-btn-${trigger.name}`}
          toggle={() => {
            this.setState({
              openTriggerTooltipName: isTooltipOpen ? null : trigger.name
            });
          }}>
          Cue trigger associated with: {btnTitle}
        </Tooltip>
      </span>
    );
  }

  renderSceneRow(scene, colWidth) {
    const players = this.getPlayersForScene(scene);
    const currentSceneName = this.props.trip.tripState.currentSceneName;
    const isCurrentScene = scene.name === currentSceneName;
    const sceneClass = isCurrentScene ? 'row-current-scene' : '';
    const columns = players.map(player => (
      this.renderScenePlayerColumn(scene, player, colWidth)
    ));

    const globalMarker = scene.global ? (
      <span className="faint ml-1">(global)</span>
    ) : null;

    const canStartScene = !scene.global && !isCurrentScene;
    const startSceneButton = canStartScene ? (
      <a
        style={{ cursor: 'pointer' }}
        onClick={() => this.handleAction('start_scene', {
          scene_name: scene.name
        })}
        className="ml-1">
        <i className="fa fa-arrow-circle-right" />
      </a>
    ) : null;

    const trip = this.props.trip;
    const triggers = _(trip.script.content.triggers)
      .filter({ scene: scene.name })
      .value();

    const triggerBtns = triggers
      .filter((trigger) => {
        if (!trigger.event) {
          return false;
        }
        return true;
      })
      .map(trigger => (
        this.renderTriggerBtn(scene, trigger)
      ));

    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="scene-header">
          {scene.title}
          <Link
            to={`/${trip.org.name}/${trip.experience.name}/script/${trip.script.revision}/design/scene/${scene.name}`}
            className="ml-1">
            <i className="fa fa-pencil" />
          </Link>
          {startSceneButton}
          {globalMarker}
        </div>
        <div className="col-sm-10">
          <div className="row">
            {columns}
          </div>
        </div>
        <div className="col-sm-2">
          {triggerBtns}
        </div>
      </div>
    );
  }

  render() {
    const trip = this.props.trip;
    const scenes = trip.script.content.scenes || [];
    const sortedScenes = _.sortBy(scenes, scene => !!scene.global);
    const maxPlayersInScene = Math.max(...sortedScenes
      .map(scene => this.getPlayersForScene(scene).length)) || 1;
    const colWidth = Math.floor(12 / maxPlayersInScene);
    const renderedScenes = sortedScenes.map(scene => (
      this.renderSceneRow(scene, colWidth)
    ));
    return (
      <div>
        {renderedScenes}
      </div>
    );
  }
}

SceneGrid.propTypes = {
  trip: PropTypes.object.isRequired,
  onEvent: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired,
  onTrigger: PropTypes.func.isRequired,
  onAdminAction: PropTypes.func.isRequired
};
