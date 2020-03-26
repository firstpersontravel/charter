import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import GroupMap from '../partials/GroupMap';
import { getPlayerPageInfo, sortPlayers, canRoleHaveUser } from '../utils';
import { getPlayerIframeUrl } from '../../utils';

export default class GroupOverview extends Component {
  renderAddUserIcon(player) {
    if (!canRoleHaveUser(player.role)) {
      return null;
    }
    if (player.user) {
      return null;
    }
    const group = this.props.group;
    return (
      <span>
        &nbsp;
        <Link
          to={
            `/${group.org.name}/${group.experience.name}` +
            `/operate/${group.id}/casting`
          }>
          <span className="text-danger">
            <i className="fa fa-user-plus" />
          </span>
        </Link>
      </span>
    );
  }

  renderActor(roleAndActors) {
    const group = this.props.group;
    const actor = roleAndActors.actors[0];
    const trip = _.find(group.trips, { id: actor.tripId });
    const pageInfo = getPlayerPageInfo(trip, actor);
    if (!pageInfo) {
      return null;
    }
    const userNameIfMultiple = roleAndActors.roleHasMultipleUsers ?
      ` (${actor.user ? actor.user.firstName : 'No user'})` : '';
    return (
      <div key={`${roleAndActors.role.name}-${roleAndActors.userId}`} className="constrain-text">
        <Link
          className={pageInfo.statusClass}
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/role/${roleAndActors.role.name}/${actor.userId || 0}`}>
          <strong>
            {roleAndActors.role.title}{userNameIfMultiple}:
          </strong>
          {' '}
          {pageInfo.status}
        </Link>
        {' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={getPlayerIframeUrl(trip, actor)}>
          <i className="fa fa-link" />
        </a>
        {this.renderAddUserIcon(actor)}
      </div>
    );
  }

  renderPlayer(player) {
    const group = this.props.group;
    const trip = _.find(group.trips, { id: player.tripId });
    const pageInfo = getPlayerPageInfo(trip, player);
    if (!pageInfo) {
      return null;
    }
    return (
      <div key={player.id} className="constrain-text">
        <Link
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/role/${player.role.name}/${player.user ? player.user.id : 0}`}>
          <strong>{trip.title}</strong>
          {' '}
          {player.role.title}:
          {' '}
          {pageInfo.status}
        </Link>
        {' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={getPlayerIframeUrl(trip, player)}>
          <i className="fa fa-link" />
        </a>
        {this.renderAddUserIcon(player)}
      </div>
    );
  }

  renderTripAndPlayers(tripAndPlayers) {
    const renderedPlayers = tripAndPlayers.players
      .map(player => this.renderPlayer(player));
    return (
      <div key={tripAndPlayers.trip.id}>
        {renderedPlayers}
      </div>
    );
  }

  renderTrip(trip) {
    const group = this.props.group;
    const currentScene = _.find(trip.script.content.scenes, {
      name: trip.currentSceneName
    });
    const currentSceneTitle = currentScene ? currentScene.title :
      'Not started';
    return (
      <div key={trip.id}>
        <Link
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/trip/${trip.id}`}>
          <strong>{trip.title}:</strong> {currentSceneTitle}
        </Link>
      </div>
    );
  }

  renderAllPlayers() {
    const group = this.props.group;
    const trips = group.trips
      .filter(trip => !trip.isArchived)
      .map(trip => (
        this.renderTrip(trip)
      ));
    const allPlayers = sortPlayers(group);
    const players = allPlayers.playersByTrip.map(p => (
      this.renderTripAndPlayers(p)
    ));
    const activeActors = allPlayers.activeActorsByRole.map(a => (
      this.renderActor(a)
    ));
    const inactiveActors = allPlayers.inactiveActorsByRole.map(a => (
      this.renderActor(a)
    ));
    return (
      <div>
        <div className="mb-2">
          <h5>Trips</h5>
          {trips}
        </div>
        <div className="mb-2">
          <h5>Travelers</h5>
          {players}
        </div>
        <div className="mb-2">
          <h5>Actors</h5>
          {activeActors}
        </div>
        {inactiveActors}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-md-7">
            <GroupMap
              group={this.props.group}
              directions={this.props.directions}
              trips={this.props.group.trips} />
          </div>
          <div className="col-md-5">
            {this.renderAllPlayers()}
          </div>
        </div>
      </div>
    );
  }
}

GroupOverview.propTypes = {
  group: PropTypes.object.isRequired,
  directions: PropTypes.array.isRequired
};
