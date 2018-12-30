import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import UserModal from '../partials/user-modal';

export default class Users extends Component {

  constructor(props) {
    super(props);
    this.handleCreateUser = this.handleCreateUser.bind(this);
    this.handleUserModalClose = this.handleUserModalClose.bind(this);
  }

  handleCreateUser(fields) {
    this.props.createInstance('users', {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phoneNumber: fields.phoneNumber,
      email: fields.email
    });
    this.handleUserModalClose();
  }

  handleUserModalClose() {
    const role = this.props.location.query.role;
    const experienceId = this.props.location.query.experienceId;
    browserHistory.push(
      `/agency/users${experienceId ? `?experienceId=${experienceId}` : ''}` +
      `${role ? `&role=${role}` : ''}`
    );
  }

  renderUser(user) {
    const statusIcons = [];
    if (user.locationTimestamp) {
      statusIcons.push(<i key="location" className="fa fa-location-arrow" />);
    }
    if (user.devicePushToken) {
      statusIcons.push(<i key="comment" className="fa fa-comment" />);
    }
    const experienceId = this.props.location.query.experienceId;
    const profileParams = { userId: user.id };
    if (experienceId) {
      profileParams.experienceId = Number(experienceId);
    }
    const userProfiles = _(this.props.profiles)
      .filter(profileParams)
      .sortBy('isActive')
      .reverse()
      .value();
    const roleLinks = _.map(userProfiles, profile => (
      <span key={profile.id}>
        <Link
          style={{
            textDecoration: profile.isActive ? '' : 'line-through'
          }}
          to={{
            pathname: '/agency/users',
            query: {
              experienceId: profile.experienceId,
              role: profile.roleName
            }
          }}>
          {profile.roleName}
        </Link>
        &nbsp;
      </span>
    ));
    return (
      <tr key={user.id}>
        <td>
          <Link
            to={`/agency/users/user/${user.id}`}>
            {user.firstName} {user.lastName}
          </Link>
        </td>
        <td>{roleLinks}</td>
        <td>{statusIcons}</td>
      </tr>
    );
  }

  renderHeader() {
    const roleName = this.props.location.query.role;
    const experienceId = this.props.location.query.experienceId;
    const experience = experienceId ?
      _.find(this.props.experiences, { id: Number(experienceId) }) : null;
    if (roleName && experience) {
      return (
        <h3>
          <Link to="/agency/users">Users</Link>
          &nbsp;›&nbsp;
          <Link to={`/agency/users?experienceId=${experienceId}`}>
            {experience.title}
          </Link>
          &nbsp;›&nbsp;
          {roleName}
        </h3>
      );
    }
    if (experience) {
      return (
        <h3>
          <Link to="/agency/users">Users</Link>
          &nbsp;›&nbsp;
          {experience.title}
        </h3>
      );
    }
    return (
      <h3>Users</h3>
    );
  }

  render() {
    const roleName = this.props.location.query.role;
    const experienceId = this.props.location.query.experienceId;
    const userRows = _.filter(this.props.users,
      (user) => {
        if (roleName === 'Archived') {
          return user.isArchived === true;
        }
        if (user.isArchived) {
          return false;
        }
        const userProfiles = _.filter(this.props.profiles, {
          userId: user.id
        });
        if (experienceId) {
          if (!_.find(userProfiles, { experienceId: Number(experienceId) })) {
            return false;
          }
          if (roleName) {
            const roleParams = {
              experienceId: Number(experienceId),
              roleName: roleName
            };
            if (!_.find(userProfiles, roleParams)) {
              return false;
            }
          }
        }
        return true;
      })
      .map(user => this.renderUser(user));
    const header = this.renderHeader();
    return (
      <div className="col-sm-9">
        {header}
        <table className="table table-striped table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {userRows}
          </tbody>
        </table>
        <div>
          <Link
            to={{
              pathname: '/agency/users',
              query: {
                role: roleName || undefined,
                experienceId: experienceId || undefined,
                editing: true
              }
            }}
            className="btn btn-sm btn-outline-secondary">
            New user
          </Link>
        </div>
        <UserModal
          isOpen={!!this.props.location.query.editing}
          user={null}
          onClose={this.handleUserModalClose}
          onConfirm={this.handleCreateUser} />
      </div>
    );
  }
}

Users.propTypes = {
  createInstance: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  experiences: PropTypes.array.isRequired
};
