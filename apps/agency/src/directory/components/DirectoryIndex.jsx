import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import UserModal from '../partials/UserModal';

export default class DirectoryIndex extends Component {

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
    const experience = this.props.experience;
    browserHistory.push(
      `/${experience.org.name}/${experience.name}/directory` +
      `${role ? `?role=${role}` : ''}`
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
    const experience = this.props.experience;
    const profileParams = { userId: user.id };
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
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            query: { role: profile.roleName }
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
            to={`/${experience.org.name}/${experience.name}/directory/user/${user.id}`}>
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
    const experience = this.props.experience;
    if (roleName) {
      return (
        <h3>
          <Link to={`/${experience.org.name}/${experience.name}/directory`}>Directory</Link>
          &nbsp;›&nbsp;
          {roleName}
        </h3>
      );
    }
    return (
      <h3>Directory</h3>
    );
  }

  render() {
    const experience = this.props.experience;
    const roleName = this.props.location.query.role;
    const users = _(this.props.profiles)
      .map('user')
      .filter(u => !u.isNull)
      .uniqBy('id')
      .value();
    const userRows = _.filter(users,
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
        if (roleName) {
          const roleParams = { roleName: roleName };
          if (!_.find(userProfiles, roleParams)) {
            return false;
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
              pathname: `/${experience.org.name}/${experience.name}/directory`,
              query: {
                role: roleName || undefined,
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

DirectoryIndex.propTypes = {
  createInstance: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  profiles: PropTypes.array.isRequired
};
