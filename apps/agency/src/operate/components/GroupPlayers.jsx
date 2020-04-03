import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Evaluator, PlayerCore, Registry } from 'fptcore';

import PopoverControl from '../../partials/PopoverControl';
import ScheduleUtils from '../../schedule/utils';
import { canRoleHaveUser } from '../utils';

const evaluator = new Evaluator(Registry);

function doesTripHaveRole(trip, roleName) {
  const role = _.find(trip.script.content.roles, { name: roleName });
  return evaluator.if(trip.actionContext, role.active_if);
}

export default class GroupPlayers extends Component {
  constructor(props) {
    super(props);
    this.handleAssignUser = this.handleAssignUser.bind(this);
  }

  handleAssignUser(roleName, trip, player, userId) {
    const user = _.find(this.props.users, { id: Number(userId) });
    if (!player) {
      const initialFields = PlayerCore.getInitialFields(trip.script.content,
        roleName, trip.variantNames.split(','));
      const fields = Object.assign({
        orgId: trip.orgId,
        tripId: trip.id,
        userId: userId
      }, initialFields);
      this.props.createInstance('players', fields);
      return;
    }
    // If it exists, update the player.
    const updateFields = { userId: user ? user.id : null };
    this.props.updateInstance('players', player.id,
      updateFields);
  }

  renderScheduleHeader(trip) {
    const group = this.props.group;
    return (
      <th key={trip.id}>
        <Link to={`/${group.org.name}/${group.experience.name}/operate/${trip.groupId}/trip/${trip.id}`}>
          {trip.title}
        </Link>
      </th>
    );
  }

  renderPlayerCell(roleName, trip, player, index) {
    const group = this.props.group;
    const experience = this.props.group.experience;
    const script = this.props.group.script;

    const role = _.find(script.content.roles, { name: roleName });
    const userIdsAlreadyChosen = _.filter(trip.players, { roleName: roleName })
      .filter(p => p !== player)
      .map(p => p.user)
      .filter(Boolean)
      .map(user => user.id);
    const user = player && player.user;

    let userLabel = 'Unassigned';
    let userClass = 'faint';
    let userId = '';

    if (user) {
      userLabel = `${user.firstName} ${user.lastName && `${user.lastName[0]}.`}`;
      userId = user.id;
      userClass = '';
    }
    const profileChoices = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.users, experience.id, roleName);
    const userChoices = profileChoices
      .map(profile => (
        _.find(this.props.users, { id: profile.userId })
      ))
      .filter(Boolean)
      .filter(profileUser => !userIdsAlreadyChosen.includes(profileUser.id))
      .map(profileUser => ({
        value: profileUser.id,
        label: `${profileUser.firstName} ${profileUser.lastName}`
      }));
    if (userChoices.length === 0) {
      return (
        <Link
          to={{
            pathname:
              `/${group.org.name}/${group.experience.name}/directory`,
            search:
              `?editing=true&role=${roleName}&experienceId=${experience.id}`
          }}>
          Create user
        </Link>
      );
    }
    const userChoicesWithNone = [{ value: '', label: 'Unassigned' }]
      .concat(userChoices);
    const goToUser = user ? (
      <Link
        className="faint"
        to={`/${group.org.name}/${group.experience.name}/directory/user/${user.id}`}>
        <i className="fa fa-user" />
      </Link>
    ) : null;
    return (
      <div>
        <PopoverControl
          title={role.title}
          choices={userChoicesWithNone}
          onConfirm={_.curry(this.handleAssignUser)(roleName, trip, player)}
          value={userId}
          label={userLabel}
          labelClassName={userClass} />
        {' '}{goToUser}
      </div>
    );
  }

  renderRoleCell(roleName, trip) {
    const experience = this.props.group.experience;
    const script = this.props.group.script;
    const tripHasRole = doesTripHaveRole(trip, roleName);
    if (!experience || !script || !tripHasRole) {
      return null;
    }
    const role = _.find(script.content.roles, { name: roleName });
    const players = _.filter(trip.players, { roleName: roleName });
    const playerCells = players.map(player => (
      <div key={player.id}>
        {this.renderPlayerCell(roleName, trip, player, 0)}
      </div>
    ));
    const maxPlayers = role.max_players || 1;
    const newCells = _.range(maxPlayers - players.length)
      .map(i => (
        <div key={i}>
          {this.renderPlayerCell(roleName, trip, null, i)}
        </div>
      ));
    return (
      <div>
        {playerCells}
        {newCells}
      </div>
    );
  }

  renderRoleRow(trips, role) {
    const tripRoleCells = trips.map(trip => (
      <td key={`${role.name}-${trip.id}`}>
        {this.renderRoleCell(role.name, trip)}
      </td>
    ));
    return (
      <tr key={role.name}>
        <td>{role.title}</td>
        {tripRoleCells}
      </tr>
    );
  }

  renderRoleRows(trips) {
    const script = this.props.group.script;
    if (!script) {
      return null;
    }
    return script.content.roles
      .filter(role => canRoleHaveUser(role))
      .map(role => this.renderRoleRow(trips, role));
  }

  render() {
    const trips = this.props.group.trips
      .filter(trip => !trip.isArchived);
    const headerCells = trips.map(trip => this.renderScheduleHeader(trip));
    const roleRows = this.renderRoleRows(trips);
    return (
      <div className="row">
        <div className="col-sm-12">
          <table className="table table-sm table-striped table-responsive">
            <thead>
              <tr>
                <th>Role</th>
                {headerCells}
              </tr>
            </thead>
            <tbody>
              {roleRows}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

GroupPlayers.propTypes = {
  group: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
