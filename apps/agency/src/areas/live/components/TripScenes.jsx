import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { EvalCore } from 'fptcore';

import { sortForRole } from '../utils';
import { isProduction } from '../../../utils';

export default class TripScenes extends Component {

  handleAction(actionName, actionParams) {
    const trip = this.props.trip;
    const shouldConfirm = isProduction();
    if (shouldConfirm) {
      const confirmText = `Are you sure you want to apply the "${actionName}" action on ${trip.script.title} ${trip.departureName} "${trip.title}"?`;
      // eslint-disable-next-line no-alert
      if (!confirm(confirmText)) {
        return;
      }
    }
    this.props.postAction(trip.id, actionName, actionParams);
  }

  renderCueButton(page, panel) {
    const trip = this.props.trip;
    const btnClass = isProduction() ? 'btn-danger' : 'btn-primary';
    const panelText = EvalCore.templateText(trip.context, panel.text || '',
      trip.script.timezone);
    const cueTitle = panel.type === 'button' ?
      `Cue ${panel.cue} ("${panelText}")` :
      `Cue ${panel.cue}`;
    return (
      <div key={panel.cue} style={{ marginTop: '0.25em' }}>
        <button
          key={`${page.name}-${panel.cue}`}
          style={{ marginTop: '0.25em' }}
          onClick={() => (
            this.handleAction('signal_cue', { cue_name: panel.cue })
          )}
          className={`wrap-text btn btn-block btn-sm ${btnClass}`}>
          {cueTitle}
        </button>
      </div>
    );
  }

  renderPlayerPage(player, page) {
    const trip = player.trip;
    const isCurrentPage = page.name === player.currentPageName;
    const isAckedPage = player.acknowledgedPageName === page.name;
    const pageClass = isCurrentPage ? 'cell-current-page' : '';
    const goToPageClass = isProduction() ? 'text-danger' : 'text-primary';
    const goToPageButton = (!isCurrentPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        style={{ marginLeft: '0.25em', cursor: 'pointer', float: 'right' }}
        onClick={() => this.handleAction('send_to_page', {
          role_name: player.roleName,
          page_name: page.name
        })}
        className={`${goToPageClass}`}>
        Go
      </a>
    ) : null;

    const refreshButton = (isCurrentPage && !isAckedPage) ? (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <a
        style={{ marginLeft: '0.25em', cursor: 'pointer', float: 'right' }}
        onClick={() => this.props.postAdminAction(trip.id, 'notify', {
          notify_type: 'refresh'
        })}>
        <i className="fa fa-hand-o-right" /> device
      </a>
    ) : null;

    const panelsWithCue = isCurrentPage ? _.filter(page.panels, 'cue') : [];
    const cueButtons = panelsWithCue
      .filter(panel => !panel.if || EvalCore.if(trip.context, panel.if))
      .map((panel, i) => this.renderCueButton(page, panel));

    const pageTitle = EvalCore.templateText(trip.context, page.title,
      trip.script.timezone);

    const isAckedIcon = isAckedPage ? (
      <span>
        &nbsp;
        <i className="fa fa-check" />
        {moment
          .utc(player.acknowledgedPageAt)
          .tz(trip.script.timezone)
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

  renderScenePlayerColumn(scene, player) {
    const pages = _.filter(player.trip.script.content.pages,
      { role: player.roleName, scene: scene.name });
    const renderedPages = pages
      .map(page => this.renderPlayerPage(player, page));
    return (
      <div className="col-sm-4" key={player.id}>
        <h4>
          <Link
            to={{
              pathname:
                `/agency/live/${player.trip.groupId}` +
                `/trip/${player.trip.id}/players` +
                `/${player.roleName}/pages`,
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

  renderSceneRow(scene, players) {
    const isCurrentScene = scene.name === this.props.trip.currentSceneName;
    const titleClass = isCurrentScene ? 'text-primary' : '';
    const sceneClass = isCurrentScene ? 'row-current-scene' : '';
    const columns = _(players)
      .filter(player => (
        _.find(this.props.trip.script.content.pages, {
          role: player.roleName,
          scene: scene.name
        })
      ))
      .map(player => (
        this.renderScenePlayerColumn(scene, player)
      ))
      .value();
    const btnClass = isProduction() ? 'btn-outline-danger' :
      'btn-outline-secondary';
    const startSceneButton = isCurrentScene ? null : (
      <button
        onClick={() => this.handleAction('start_scene', {
          scene_name: scene.name
        })}
        className={`wrap-text btn btn-block btn-sm ${btnClass}`}>
        Start {scene.name}
      </button>
    );
    return (
      <div key={scene.name} className={`row row-scene ${sceneClass}`}>
        <div className="col-sm-2">
          <h3 className={titleClass}>{scene.title}</h3>
          {startSceneButton}
        </div>
        <div className="col-sm-10">
          <div className="row">
            {columns}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const trip = this.props.trip;
    const showPastScenes = this.props.location.query.past === 'true';
    const roles = _(trip.script.content.roles)
      .filter(role => !role.if || EvalCore.if(trip.context, role.if))
      .sortBy([sortForRole, 'name'])
      .value();
    const players = _(roles)
      .map(role => _.find(trip.players, { roleName: role.name }))
      .filter('currentPageName')
      .value();
    const scenes = trip.script.content.scenes || [];
    const indexOfCurrentScene = _.findIndex(scenes, {
      name: trip.currentSceneName
    });
    const scenesToShow = showPastScenes ? scenes : scenes.filter((
      (scene, i) => (i >= indexOfCurrentScene)
    ));
    const renderedScenes = scenesToShow.map(scene => (
      this.renderSceneRow(scene, players)
    ));
    const pastScenesAlert = showPastScenes ? null : (
      <div className="alert alert-info">
        Past scenes hidden.&nbsp;
        <Link
          to={{
            pathname: `/agency/live/${trip.groupId}/trip/${trip.id}/scenes`,
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
  trip: PropTypes.object,
  location: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired,
  postAdminAction: PropTypes.func.isRequired
};

TripScenes.defaultProps = {
  trip: null
};
