import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

import { coreEvaluator, coreRegistry, coreWalker } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import Preview from '../operate/partials/Preview';
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
    this.cachedTriggerNames = {};
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

  /**
   * Cache button titles since it's expensive to walk through all buttons
   * and nested objects.
   */
  getTriggerTitle(trigger) {
    const script = this.props.trip.script;
    const key = `${script.id}-${trigger.name}`;
    if (this.cachedTriggerNames[key]) {
      return this.cachedTriggerNames[key];
    }
    const triggerResourceClass = coreRegistry.resources.trigger;
    const triggerTitle = triggerResourceClass.getEventTitle(
      script.content, trigger, coreRegistry, coreWalker);
    this.cachedTriggerNames[key] = triggerTitle;
    return triggerTitle;
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
    return (
      <Preview
        key={page.name}
        trip={trip}
        player={player}
        page={page}
        onEvent={this.props.onEvent}
        onAction={this.props.onAction} />
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
        className="ml-1 text-dark"
        rel="noopener noreferrer"
        href={getPlayerIframeUrl(trip, player)}>
        <i className="fa fa-external-link" />
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
    const btnTitle = this.getTriggerTitle(trigger);
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
        // For now show all triggers; even those that can be activated more
        // easily by buttons on the preview. This is because buttons in
        // interface content pages (like other tabs) aren't shown in the
        // preview by default so those could be untriggerable in testing.

        // const eventResourceClass = coreRegistry.events[trigger.event.type];
        // if (eventResourceClass.parentComponentType === 'panels') {
        //   return false;
        // }
        return true;
      })
      .map(trigger => (
        this.renderTriggerBtn(scene, trigger)
      ));

    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="scene-header">
          <ResourceBadge
            resourceType="scene"
            className="mr-1"
            showType={false} />
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
  onTrigger: PropTypes.func.isRequired
};
