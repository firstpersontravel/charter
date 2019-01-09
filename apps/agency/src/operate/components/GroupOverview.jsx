import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IndexLink, Link } from 'react-router';

import GroupMap from '../partials/GroupMap';
import { getPlayerPageInfo, sortPlayers } from '../utils';

export default class GroupOverview extends Component {
  renderAddUserIcon(player) {
    if (!player.role.user) {
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
            `/operate/${group.id}/all/casting`
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
        <IndexLink
          className={pageInfo.statusClass}
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/all/role/${roleAndActors.role.name}/${actor.userId}`}>
          <strong>
            {roleAndActors.role.name}{userNameIfMultiple}:
          </strong>
          {' '}
          {trip.departureName}
          {' '}
          {pageInfo.status}
        </IndexLink>
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
        <IndexLink
          to={`/${group.org.name}/${group.experience.name}/operate/${group.id}/trip/${trip.id}/players/${player.role.name}`}>
          {trip.departureName} {player.role.name}:
          {' '}
          {pageInfo.status}
        </IndexLink>
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

  renderAllPlayers() {
    const group = this.props.group;
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
        <div style={{ marginBottom: '0.5em' }}>
          <h5>Travelers</h5>
          {players}
        </div>
        <div style={{ marginBottom: '0.5em' }}>
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
