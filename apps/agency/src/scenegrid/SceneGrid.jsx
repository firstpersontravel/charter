import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

import { coreRegistry, coreWalker, SceneCore } from 'fptcore';

import ResourceBadge from '../partials/ResourceBadge';
import Preview from '../operate/partials/Preview';
import { getPlayerIframeUrl } from '../utils';
import { isTriggerOnPageInScene } from '../design/utils/section-utils';

const promptsForTriggerEventTypes = {
  text_received: {
    prompt: 'What message?',
    getEvent: result => ({ content: result })
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
      openTriggerTooltipName: null
    };
    this.cachedTriggerNames = {};
  }

  getPlayersForScene(scene) {
    const { trip } = this.props;
    return _(trip.players)
      .filter(player => player.role && player.role.interface)
      .filter(player => (
        _.find(trip.script.content.pages, {
          interface: player.role.interface,
          scene: scene.name
        })
      ))
      .sort((a, b) => SceneCore.sortResource(a.role, b.role))
      .value();
  }

  /**
   * Cache button titles since it's expensive to walk through all buttons
   * and nested objects.
   */
  getTriggerTitle(trigger) {
    const { script } = this.props.trip;
    const key = `${script.id}-${trigger.name}`;
    if (this.cachedTriggerNames[key]) {
      return this.cachedTriggerNames[key];
    }
    const triggerResourceClass = coreRegistry.resources.trigger;
    const triggerTitle = triggerResourceClass.getEventTitle(
      script.content, trigger, coreRegistry, coreWalker
    );
    this.cachedTriggerNames[key] = triggerTitle;
    return triggerTitle;
  }

  handleAdminAction(name, params) {
    this.props.onAdminAction(name, params);
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
    const { trip } = this.props;
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
    const { trip } = this.props;
    const pages = _.filter(trip.script.content.pages, {
      interface: player.role.interface,
      scene: scene.name
    });
    const renderedPages = pages
      .sort(SceneCore.sortResource)
      .map(page => this.renderPlayerPage(player, page));
    const iframeLink = trip.id ? (
      <a
        target="_blank"
        className="ml-1 text-dark"
        rel="noopener noreferrer"
        href={getPlayerIframeUrl(trip, player)}>
        <i className="fa fa-external-link-alt" />
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
    const { trip } = this.props;
    const { currentSceneName } = this.props.trip.tripState;
    const isCurrentScene = scene.name === currentSceneName;
    const hasBeenTriggered = !!trip.history[trigger.name];
    const canTrigger = isCurrentScene || scene.global;
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
          Cue trigger associated with:
          {' '}
          {btnTitle}
        </Tooltip>
      </span>
    );
  }

  renderSceneRow(scene, colWidth, isFirst) {
    const players = this.getPlayersForScene(scene);
    const { currentSceneName } = this.props.trip.tripState;
    const isCurrentScene = scene.name === currentSceneName;
    const sceneClass = isCurrentScene ? 'row-current-scene' : '';
    const columns = players.map(player => (
      this.renderScenePlayerColumn(scene, player, colWidth)
    ));

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

    const { trip } = this.props;
    const triggers = _(trip.script.content.triggers)
      .filter({ scene: scene.name })
      .value();

    const triggerBtns = triggers
      .filter((trigger) => {
        if (!trigger.event) {
          return false;
        }
        // If trigger is on a page in the scene (not a global page) -- don't
        // include it on the side since it's already covered by the page
        // preview.
        if (isTriggerOnPageInScene(trip.script.content, trigger, scene.name)) {
          return false;
        }
        return true;
      })
      .map(trigger => (
        this.renderTriggerBtn(scene, trigger)
      ));

    const resetBtn = isFirst ? (
      <button
        onClick={() => this.handleAdminAction('reset')}
        style={{
          marginTop: 0,
          marginBottom: '0.25em'
        }}
        className="constrain-text btn btn-block btn-xs btn-outline-secondary">
        reset to start
      </button>
    ) : null;

    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="scene-header">
          <ResourceBadge
            resource={scene}
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
        </div>
        <div className="col-sm-10">
          <div className="row">
            {columns}
          </div>
        </div>
        <div className="col-sm-2">
          <div style={{ position: 'sticky', top: '5px' }}>
            {resetBtn}
            {triggerBtns}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { trip } = this.props;
    const scenes = _.get(trip, 'script.content.scenes') || [];
    const sortedScenes = scenes.sort(SceneCore.sortResource);
    const maxPlayersInScene = Math.max(...sortedScenes
      .map(scene => this.getPlayersForScene(scene).length)) || 1;
    const colWidth = Math.floor(12 / maxPlayersInScene);
    const renderedScenes = sortedScenes.map((scene, i) => (
      this.renderSceneRow(scene, colWidth, i === 0)
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
  onAdminAction: PropTypes.func.isRequired,
  onTrigger: PropTypes.func.isRequired
};
