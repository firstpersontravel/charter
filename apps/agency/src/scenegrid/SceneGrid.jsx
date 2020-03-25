import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { UncontrolledPopover, PopoverHeader, PopoverBody } from 'reactstrap';

import { Evaluator, Registry, TemplateUtil } from 'fptcore';

import { renderHeader, renderPage } from '../operate/partials/Preview';
import ResourceBadge from '../partials/ResourceBadge';
import { sortForRole } from '../operate/utils';
import { isProduction, getPlayerIframeUrl } from '../utils';

const evaluator = new Evaluator(Registry);

export default class SceneGrid extends Component {
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
    const isAckedPage = player.acknowledgedPageName === page.name;
    const pageClass = isCurrentPage ? 'cell-current-page' : '';
    const panelsWithCue = isCurrentPage ? _.filter(page.panels, 'cue') : [];
    const cueButtons = panelsWithCue
      .filter(panel => evaluator.if(trip.actionContext, panel.visible_if))
      .map((panel, i) => this.renderCueButton(page, panel));

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

    return (
      <tr key={page.name} className={`cell-page ${pageClass}`}>
        <td>
          {goToPageButton}
          <ResourceBadge
            resourceType="page"
            className="mr-1"
            showType={false} />
          {pageTitle}
          <span
            style={{ cursor: 'pointer' }}
            className="ml-1"
            id={`popover-target-${page.name}`}>
            <i className="fa fa-search" />
          </span>
          {refreshButton}
          {isAckedIcon}
          {cueButtons}
          <UncontrolledPopover
            trigger="legacy"
            target={`popover-target-${page.name}`}>
            <PopoverHeader>
              {renderHeader(trip, player, page)}
            </PopoverHeader>
            <PopoverBody>
              {renderPage(trip, player, page)}
            </PopoverBody>
          </UncontrolledPopover>
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
    const iframeLink = player.id ? (
      <a
        target="_blank"
        className="ml-1"
        rel="noopener noreferrer"
        href={getPlayerIframeUrl(trip, player)}>
        <i className="fa fa-link" />
      </a>
    ) : null;
    return (
      <div className={`col-sm-${colWidth}`} key={player.roleName}>
        <h5 className="constrain-text">
          <ResourceBadge resourceType="role" className="mr-1" showType={false} />
          {player.role.title}
          {iframeLink}
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
          {triggerResourceClass.getEventTitle(trip.script.content, trigger,
            Registry)}
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

    const globalMarker = scene.global ? (
      <div><span className="faint">Global</span></div>
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

    // HACK -- filter all page buttons in this scene out of trigger list
    // for this scene, since they're already available as part of that
    // players page display.
    const scenePageButtonCueNames = _(trip.script.content.pages)
      .filter({ scene: scene.name })
      .map(page => page.panels)
      .flatten()
      .filter(panel => panel && panel.type === 'button')
      .map(panel => panel.cue)
      .filter(Boolean)
      .value();

    const triggerBtns = triggers
      .filter((trigger) => {
        if (!trigger.event) {
          return false;
        }
        if (trigger.event.type === 'cue_signaled') {
          if (scenePageButtonCueNames.includes(trigger.event.cue)) {
            return false;
          }
        }
        return true;
      })
      .map(trigger => (
        this.renderTriggerBtn(scene, trigger)
      ));

    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="col-sm-2">
          <h5 className={titleClass}>
            <ResourceBadge resourceType="scene" className="mr-1" showType={false} />
            {scene.title} {startSceneButton}
          </h5>
          {globalMarker}
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

SceneGrid.propTypes = {
  trip: PropTypes.object.isRequired,
  onAction: PropTypes.func.isRequired,
  onTrigger: PropTypes.func.isRequired,
  onAdminAction: PropTypes.func.isRequired
};
