import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { EvalCore } from 'fptcore';

import PopoverControl from '../../partials/PopoverControl';
import ScheduleUtils from '../../schedule/utils';

function doesTripHaveRole(trip, roleName) {
  const role = _.find(trip.script.content.roles, { name: roleName });
  if (!role.if) {
    return true;
  }
  return EvalCore.if(trip.evalContext, role.if);
}

function renderScheduleHeader(trip) {
  return (
    <th key={trip.id}>
      <Link to={`/operate/${trip.groupId}/trip/${trip.id}`}>
        {trip.departureName}: {trip.title}
      </Link>
    </th>
  );
}

export default class GroupPlayers extends Component {

  constructor(props) {
    super(props);
    this.handleAssignUser = this.handleAssignUser.bind(this);
  }

  handleAssignUser(roleName, trips, userId) {
    const user = _.find(this.props.users, { id: Number(userId) });
    _.each(trips, (trip) => {
      // Find player for each trip.
      const player = _.find(trip.players, { roleName: roleName });
      if (!player) {
        console.warn('Player not found.');
        return;
      }
      // If it exists, update the player.
      const updateFields = { userId: user ? user.id : null };
      this.props.updateInstance('players', player.id,
        updateFields);
    });
  }

  renderRoleCell(roleName, trips) {
    const experience = this.props.groupStatus.instance.experience;
    const script = this.props.groupStatus.instance.script;
    const tripsWithRole = trips
      .filter(trip => doesTripHaveRole(trip, roleName));
    if (!experience || !script || tripsWithRole.length === 0) {
      return null;
    }
    const departureNames = _.uniq(_.map(tripsWithRole, 'departureName'));
    const departureName = departureNames.length === 1 ? departureNames[0] : null;
    const users = _.uniq(tripsWithRole
      .map(trip => _.find(trip.players, { roleName: roleName }))
      .map(player => player && player.user));

    let userLabel = 'Unassigned';
    let userClass = 'faint';
    let userId = '';

    if (users.length > 1) {
      userLabel = 'Mixed';
    } else if (users.length === 1 && users[0]) {
      const user = users[0];
      userLabel = `${user.firstName} ${user.lastName && `${user.lastName[0]}.`}`;
      userId = user.id;
      userClass = '';
    }
    const profileChoices = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.users, experience.id, roleName,
      departureName);
    const userChoices = profileChoices
      .map(profile => (
        _.find(this.props.users, { id: profile.userId })
      ))
      .filter(Boolean)
      .map(user => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`
      }));
    if (userChoices.length === 0) {
      if (trips.length === 1) {
        return (
          <Link
            to={{
              pathname: '/users',
              query: {
                editing: true,
                role: roleName,
                experienceId: experience.id
              }
            }}>
            Add user
          </Link>
        );
      }
      return null;
    }
    const userChoicesWithNone = [{ value: '', label: 'Unassigned' }]
      .concat(userChoices);
    const goToUser = (users.length === 1 && users[0]) ? (
      <Link className="faint" to={`/users/user/${users[0].id}`}>
        <i className="fa fa-user" />
      </Link>
    ) : null;
    return (
      <div>
        <PopoverControl
          title={roleName}
          choices={userChoicesWithNone}
          onConfirm={_.curry(this.handleAssignUser)(roleName, tripsWithRole)}
          value={userId}
          label={userLabel}
          labelClassName={userClass} />
        {' '}{goToUser}
      </div>
    );
  }

  renderRoleRow(trips, roleName) {
    const tripRoleCells = trips.map(trip => (
      <td key={`${roleName}-${trip.id}`}>
        {this.renderRoleCell(roleName, [trip])}
      </td>
    ));
    return (
      <tr key={roleName}>
        <td>{roleName}</td>
        {tripRoleCells}
        <td key={`${roleName}-all`}>
          {this.renderRoleCell(roleName, trips)}
        </td>
      </tr>
    );
  }

  renderRoleRows(trips) {
    const script = this.props.groupStatus.instance.script;
    if (!script) {
      return null;
    }
    return script.content.roles
      .filter(role => role.user)
      .map(role => this.renderRoleRow(trips, role.name));
  }

  render() {
    const trips = this.props.groupStatus.instance.trips;
    const headerCells = trips.map(renderScheduleHeader);
    const roleRows = this.renderRoleRows(trips);
    return (
      <div className="row">
        <div className="col-sm-12">
          <table className="table table-sm table-striped table-responsive">
            <thead>
              <tr>
                <th>Role</th>
                {headerCells}
                <th>All</th>
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
  groupStatus: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  updateInstance: PropTypes.func.isRequired
};