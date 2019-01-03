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
    const organizationName = this.props.params.organizationName;
    return (
      <span>
        &nbsp;
        <Link to={`/${organizationName}/operate/${player.trip.groupId}/all/casting`}>
          <span className="text-danger">
            <i className="fa fa-user-plus" />
          </span>
        </Link>
      </span>
    );
  }

  renderActor(roleAndActors) {
    const organizationName = this.props.params.organizationName;
    const actor = roleAndActors.actors[0];
    const pageInfo = getPlayerPageInfo(actor);
    if (!pageInfo) {
      return null;
    }
    const userNameIfMultiple = roleAndActors.roleHasMultipleUsers ?
      ` (${actor.user ? actor.user.firstName : 'No user'})` : '';
    return (
      <div key={`${roleAndActors.role.name}-${roleAndActors.userId}`} className="constrain-text">
        <IndexLink
          className={pageInfo.statusClass}
          to={`/${organizationName}/operate/${actor.trip.groupId}/all/role/${roleAndActors.role.name}/${actor.userId}`}>
          <strong>
            {roleAndActors.role.name}{userNameIfMultiple}:
          </strong>
          {' '}
          {actor.trip.departureName}
          {' '}
          {pageInfo.status}
        </IndexLink>
        {this.renderAddUserIcon(actor)}
      </div>
    );
  }

  renderPlayer(player) {
    const organizationName = this.props.params.organizationName;
    const pageInfo = getPlayerPageInfo(player);
    if (!pageInfo) {
      return null;
    }
    return (
      <div key={player.id} className="constrain-text">
        <IndexLink
          to={`/${organizationName}/operate/${player.trip.groupId}/trip/${player.trip.id}/players/${player.role.name}`}>
          {player.trip.departureName} {player.role.name}:
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
    const group = this.props.groupStatus.instance;
    if (group.trips.length === 0 || !group.script) {
      return null;
    }
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
    const trips = _.get(this.props.groupStatus, 'instance.trips') || [];
    if (trips.length === 0) {
      return <div>No trips</div>;
    }
    return (
      <div>
        <div className="row">
          <div className="col-md-7">
            <GroupMap
              organizationName={this.props.params.organizationName}
              trips={trips} />
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
  groupStatus: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
