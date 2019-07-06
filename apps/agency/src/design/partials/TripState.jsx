import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Evaluator, Registry, TemplateUtil } from 'fptcore';

import ResourceBadge from './ResourceBadge';
import { sortForRole } from '../../operate/utils';
import { isProduction } from '../../utils';

const evaluator = new Evaluator(Registry);

export default class TripState extends Component {
  getPlayersForScene(scene) {
    const trip = this.props.trip;
    return _(trip.players)
      .filter(player => (
        evaluator.if(trip.actionContext, player.role.active_if)
      ))
      .filter(player => (
        _.find(trip.script.content.pages, {
          role: player.roleName,
          scene: scene.name
        })
      ))
      .sortBy(player => sortForRole(player.role))
      .value();
  }

  handleAction(actionName, actionParams) {
    this.props.onAction(actionName, actionParams);
  }

  renderCueButton(page, panel) {
    const isCurrentScene = page.scene === this.props.trip.currentSceneName;
    const trip = this.props.trip;
    const pageScene = _.find(trip.script.content.scenes, { name: page.scene });
    const pageSceneTitle = pageScene.title;
    const activeBtnClass = isProduction() ? 'btn-danger' : 'btn-primary';
    const btnClass = isCurrentScene ? activeBtnClass : 'btn-secondary';
    const panelText = TemplateUtil.templateText(trip.evalContext,
      panel.text || '', trip.experience.timezone);
    const activeCueTitle = panel.type === 'button' ?
      panelText : `Cue ${panel.cue}`;
    const inactiveCueTitle = (
      <span>
        <span style={{ textDecoration: 'line-through' }}>{panelText}</span>
        &nbsp;(waiting for scene &quot;{pageSceneTitle}&quot;)
      </span>
    );
    const cueTitle = isCurrentScene ? activeCueTitle : inactiveCueTitle;
    return (
      <div key={panel.cue} className="mt-1">
        <button
          disabled={!isCurrentScene}
          key={`${page.name}-${panel.cue}`}
          onClick={() => (
            this.handleAction('signal_cue', { cue_name: panel.cue })
          )}
          className={`wrap-text btn btn-block btn-sm mt-1 ${btnClass}`}>
          {cueTitle}
        </button>
      </div>
    );
  }

  renderPlayerPage(player, page) {
    const trip = this.props.trip;
    const isCurrentPage = page.name === player.currentPageName;
    const pageClass = isCurrentPage ? 'cell-current-page' : '';
    const panelsWithCue = isCurrentPage ? _.filter(page.panels, 'cue') : [];
    const cueButtons = panelsWithCue
      .filter(panel => evaluator.if(trip.actionContext, panel.visible_if))
      .map((panel, i) => this.renderCueButton(page, panel));

    const pageTitle = TemplateUtil.templateText(trip.evalContext, page.title,
      trip.experience.timezone);

    return (
      <tr key={page.name} className={`cell-page ${pageClass}`}>
        <td>
          <ResourceBadge
            resourceType="page"
            className="mr-1"
            showType={false} />
          {pageTitle}
          {cueButtons}
        </td>
      </tr>
    );
  }

  renderScenePlayerColumn(scene, player, colWidth) {
    const trip = this.props.trip;
    const pages = _.filter(trip.script.content.pages,
      { role: player.roleName, scene: scene.name });
    const renderedPages = pages
      .map(page => this.renderPlayerPage(player, page));
    return (
      <div className={`col-sm-${colWidth}`} key={player.roleName}>
        <h5 className="constrain-text">
          <ResourceBadge resourceType="role" className="mr-1" showType={false} />
          {player.role.title}
        </h5>
        <table className="table table-sm table-striped" style={{ margin: 0 }}>
          <tbody>
            {renderedPages}
          </tbody>
        </table>
      </div>
    );
  }

  renderTriggerBtn(scene, trigger) {
    const trip = this.props.trip;
    const triggerResourceClass = Registry.resources.trigger;
    const isCurrentScene = scene.name === this.props.trip.currentSceneName;
    const isActiveGlobalScene = scene.global && (
      evaluator.if(trip.actionContext, scene.active_if)
    );
    const hasBeenTriggered = !!trip.history[trigger.name];
    const canTrigger = isCurrentScene || isActiveGlobalScene;
    const style = {
      marginTop: 0,
      marginBottom: '0.25em',
      textDecoration: hasBeenTriggered ? 'line-through' : ''
    };
    return (
      <span key={trigger.name}>
        <button
          disabled={!canTrigger}
          onClick={() => this.props.onTrigger(trigger.name)}
          style={style}
          className="constrain-text btn btn-block btn-xs btn-outline-secondary">
          {triggerResourceClass.getTitle(trip.script.content, trigger)}
        </button>
      </span>
    );
  }

  renderSceneRow(scene, colWidth) {
    const players = this.getPlayersForScene(scene);
    const isCurrentScene = scene.name === this.props.trip.currentSceneName;
    const titleClass = isCurrentScene ? 'text-primary' : '';
    const sceneClass = isCurrentScene ? 'row-current-scene' : '';
    const columns = players.map(player => (
      this.renderScenePlayerColumn(scene, player, colWidth)
    ));
    const btnClass = isProduction() ? 'btn-outline-danger' :
      'btn-outline-secondary';

    const globalMarker = scene.global ? (
      <div><span className="faint">Global</span></div>
    ) : null;

    const canStartScene = !scene.global && !isCurrentScene;
    const startSceneButton = canStartScene ? (
      <button
        onClick={() => this.handleAction('start_scene', {
          scene_name: scene.name
        })}
        className={`wrap-text btn btn-block btn-sm ${btnClass}`}>
        Start {scene.title}
      </button>
    ) : null;

    const trip = this.props.trip;
    const triggers = _(trip.script.content.triggers)
      .filter({ scene: scene.name })
      .value();

    const triggerBtns = triggers.map(trigger => (
      this.renderTriggerBtn(scene, trigger)
    ));

    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="col-sm-2">
          <h4 className={titleClass}>
            <ResourceBadge resourceType="scene" className="mr-1" showType={false} />
            {scene.title}
          </h4>
          {globalMarker}
          {startSceneButton}
        </div>
        <div className="col-sm-8">
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

TripState.propTypes = {
  trip: PropTypes.object.isRequired,
  onAction: PropTypes.func.isRequired,
  onTrigger: PropTypes.func.isRequired
};
