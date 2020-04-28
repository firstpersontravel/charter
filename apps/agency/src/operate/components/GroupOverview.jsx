import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { coreEvaluator } from 'fptcore';

import GroupMap from '../partials/GroupMap';
import {
  sortForRole,
  canRoleHaveUser
} from '../utils';
import { getUserIframeUrl, getPlayerIframeUrl } from '../../utils';

function getAllPlayers(trips) {
  const tripsById = _.fromPairs(_.map(trips, t => [t.id, t]));
  return _(trips)
    .map('players')
    .flatten()
    .filter(player => coreEvaluator.if(
      tripsById[player.tripId].actionContext,
      player.role.active_if
    ))
    .value();
}

function getTripPlayer(trip, roleName, user) {
  return trip.players.find(p => (
    p.roleName === roleName &&
    p.userId === (user ? user.id : null)
  ));
}

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

  renderRoleUser(role, user) {
    const group = this.props.group;
    const userId = user ? user.id : 0;
    const userName = user ? user.firstName : 'No user';
    const trips = group.trips
      .filter(trip => getTripPlayer(trip, role.name, user));
    if (!trips.length) {
      return null;
    }
    const tripTitles = trips.map(t => t.title).join(', ');
    const externalUrl = trips.length > 1 ?
      getUserIframeUrl(group, user) :
      getPlayerIframeUrl(trips[0], getTripPlayer(trips[0], role.name, user));

    return (
      <div key={`${role.name}-${userId}`} className="constrain-text">
        <Link
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/role/${role.name}/${userId}`}>
          <strong>{role.title}</strong> ({userName}, {tripTitles})
        </Link>
        <a
          className="ml-1"
          target="_blank"
          rel="noopener noreferrer"
          href={externalUrl}>
          <i className="fa fa-external-link" />
        </a>
      </div>
    );
  }

  renderRole(role, users) {
    return users.map(user => this.renderRoleUser(role, user));
  }

  renderTrip(trip) {
    const group = this.props.group;
    const currentScene = _.find(trip.script.content.scenes, {
      name: trip.tripState.currentSceneName
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

    const roles = _(group.script.content.roles)
      .filter(role => canRoleHaveUser(role))
      .sortBy([sortForRole, 'name'])
      .value();
    const allPlayers = getAllPlayers(group.trips);

    function usersForRole(role) {
      return _(allPlayers)
        .filter(player => !!player.role.interface)
        .filter({ roleName: role.name })
        .map('user')
        .uniq()
        .flatten()
        .value();
    }

    const renderedPlayers = roles.map(role => (
      this.renderRole(role, usersForRole(role))
    ));

    return (
      <div>
        <div className="mb-2">
          <h5>Trips</h5>
          {trips}
        </div>
        <div className="mb-2">
          <h5>Participants</h5>
          {renderedPlayers}
        </div>
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
