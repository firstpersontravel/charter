import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ConditionCore, ResourcesRegistry, TemplateUtil } from 'fptcore';

import { sortForRole } from '../utils';
import { isProduction } from '../../utils';

export default class TripScenes extends Component {
  getPlayersForScene(scene) {
    return _(this.props.trip.players)
      .filter(player => (
        _.find(this.props.trip.script.content.pages, {
          role: player.roleName,
          scene: scene.name
        })
      ))
      .sortBy(player => sortForRole(player.role))
      .value();
  }

  handleAction(actionName, actionParams) {
    const trip = this.props.trip;
    const shouldConfirm = isProduction();
    if (shouldConfirm) {
      const confirmText = `Are you sure you want to apply the "${actionName}" action on ${trip.experience.title} ${trip.departureName} "${trip.title}"?`;
      // eslint-disable-next-line no-alert
      if (!confirm(confirmText)) {
        return;
      }
    }
    this.props.postAction(trip.orgId, trip.experienceId, trip.id, actionName,
      actionParams);
  }

  renderCueButton(page, panel) {
    const isCurrentScene = page.scene === this.props.trip.currentSceneName;
    const trip = this.props.trip;
    const pageScene = _.find(trip.script.content.scenes, { name: page.scene });
    const pageSceneTitle = pageScene.title;
    const activeBtnClass = isProduction() ? 'btn-danger' : 'btn-primary';
    const btnClass = isCurrentScene ? activeBtnClass : 'btn-secondary';
    const panelText = TemplateUtil.templateText(trip.evalContext, panel.text || '',
      trip.experience.timezone);
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
    const isAckedPage = player.acknowledgedPageName === page.name;
    const pageClass = isCurrentPage ? 'cell-current-page' : '';
    const goToPageClass = isProduction() ? 'text-danger' : 'text-primary';
    const goToPageButton = (!isCurrentPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        style={{ cursor: 'pointer', float: 'right' }}
        onClick={() => this.handleAction('send_to_page', {
          role_name: player.roleName,
          page_name: page.name
        })}
        className={`ml-1 ${goToPageClass}`}>
        Go
      </a>
    ) : null;

    const refreshButton = (isCurrentPage && !isAckedPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        className="ml-1"
        style={{ cursor: 'pointer', float: 'right' }}
        onClick={() => this.props.postAdminAction(
          trip.orgId, trip.experienceId, trip.id,
          'notify', { notify_type: 'refresh' }
        )}>
        <i className="fa fa-hand-o-right" /> device
      </a>
    ) : null;

    const panelsWithCue = isCurrentPage ? _.filter(page.panels, 'cue') : [];
    const cueButtons = panelsWithCue
      .filter(panel => ConditionCore.if(trip.evalContext, panel.visible_if))
      .map((panel, i) => this.renderCueButton(page, panel));

    const pageTitle = TemplateUtil.templateText(trip.evalContext, page.title,
      trip.experience.timezone);

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

    return (
      <tr key={page.name} className={`cell-page ${pageClass}`}>
        <td>
          {goToPageButton}
          {refreshButton}
          {pageTitle}
          {isAckedIcon}
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
      <div className={`col-sm-${colWidth}`} key={player.id}>
        <h4>
          <Link
            to={{
              pathname:
                `/${trip.org.name}/${trip.experience.name}` +
                `/operate/${trip.groupId}` +
                `/trip/${trip.id}/players` +
                `/${player.roleName}`,
              query: { scene: scene.name }
            }}>
            {player.roleName}
          </Link>
        </h4>
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
    const triggerResourceClass = ResourcesRegistry.trigger;
    const isCurrentScene = scene.name === this.props.trip.currentSceneName;
    const isActiveGlobalScene = scene.global && (
      ConditionCore.if(trip.evalContext, scene.active_if)
    );
    const hasBeenTriggered = !!trip.history[trigger.name];
    const canTrigger = isCurrentScene || isActiveGlobalScene;
    // const isForbidden = (
    //   (trigger.repeatable === false && hasBeenTriggered) ||
    //   (!ConditionCore.if(trip.evalContext, trigger.active_if))
    // );
    const style = {
      marginTop: 0,
      marginBottom: '0.25em',
      textDecoration: hasBeenTriggered ? 'line-through' : ''
    };
    return (
      <button
        key={trigger.name}
        disabled={!canTrigger}
        onClick={() => this.props.postAdminAction(
          trip.orgId, trip.experienceId, trip.id,
          'trigger', { trigger_name: trigger.name })}
        style={style}
        className="constrain-text btn btn-block btn-xs btn-outline-secondary">
        {triggerResourceClass.getTitle(trip.script.content, trigger)}
      </button>
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
          <h3 className={titleClass}>{scene.title}</h3>
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
    const showPastScenes = this.props.location.query.past === 'true';
    const scenes = trip.script.content.scenes || [];

    const nonGlobalScenes = scenes.filter(scene => !scene.global);
    const indexOfCurrentScene = _.findIndex(nonGlobalScenes, {
      name: trip.currentSceneName
    });

    const scenesToShow = showPastScenes ? scenes : scenes
      .filter(scene => !scene.global)
      .filter((scene, i) => (i >= indexOfCurrentScene));

    const sortedScenes = _.sortBy(scenesToShow, scene => !!scene.global);
    const maxPlayersInScene = Math.max(...sortedScenes
      .map(scene => this.getPlayersForScene(scene).length)) || 1;
    const colWidth = Math.floor(12 / maxPlayersInScene);
    const renderedScenes = sortedScenes.map(scene => (
      this.renderSceneRow(scene, colWidth)
    ));
    const pastScenesAlert = showPastScenes ? null : (
      <div className="alert alert-info">
        Past scenes hidden.&nbsp;
        <Link
          to={{
            pathname:
              `/${trip.org.name}/${trip.experience.name}` +
              `/operate/${trip.groupId}/trip/${trip.id}/scenes`,
            query: { past: true }
          }}>
          Show all
        </Link>
      </div>
    );
    return (
      <div>
        {pastScenesAlert}
        {renderedScenes}
      </div>
    );
  }
}

TripScenes.propTypes = {
  trip: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired
};
