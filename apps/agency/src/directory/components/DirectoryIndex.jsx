import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import Loader from '../../partials/Loader';
import UserModal from '../partials/UserModal';

export default class DirectoryIndex extends Component {
  constructor(props) {
    super(props);
    this.handleCreateUser = this.handleCreateUser.bind(this);
    this.handleUserModalClose = this.handleUserModalClose.bind(this);
  }

  getUsers() {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    return this.props.users.filter((user) => {
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
    });
  }

  handleCreateUser(fields) {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    const userFields = {
      orgId: this.props.experience.orgId,
      experienceId: this.props.experience.id,
      firstName: fields.firstName,
      lastName: fields.lastName,
      phoneNumber: fields.phoneNumber,
      email: fields.email
    };
    const profilesToCreate = roleName ? [{
      collection: 'profiles',
      fields: {
        orgId: this.props.experience.orgId,
        experienceId: this.props.experience.id,
        roleName: roleName
      },
      insertions: {
        userId: 'id'
      }
    }] : null;
    this.props.createInstances('users', userFields, profilesToCreate);
    this.handleUserModalClose();
  }

  handleUserModalClose() {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    const experience = this.props.experience;
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory` +
      `${roleName ? `?role=${roleName}` : ''}`);
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
        <NavLink
          style={{
            textDecoration: profile.isActive ? '' : 'line-through'
          }}
          to={{
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            query: { role: profile.roleName }
          }}>
          {_.get(profile, 'role.title')}
        </NavLink>
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
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    const experience = this.props.experience;
    if (roleName && experience.script) {
      const role = _.find(experience.script.content.roles, { name: roleName });
      const roleTitle = roleName === 'Archived' ? 'Archived' :
        (role && role.title);
      return (
        <h3>
          <Link to={`/${experience.org.name}/${experience.name}/directory`}>Directory</Link>
          &nbsp;›&nbsp;
          {roleTitle}
        </h3>
      );
    }
    return (
      <h3>Directory</h3>
    );
  }

  renderNewUserButton() {
    const experience = this.props.experience;
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    if (roleName === 'Archived') {
      return null;
    }
    const role = _.find(experience.script.content.roles, { name: roleName });
    const roleTitle = role && role.title;

    const btnTitle = roleName ? `New ${roleTitle} user` : 'New user';
    return (
      <div>
        <Link
          to={{
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            search: `?role=${roleName || ''}&editing=true`
          }}
          className="btn btn-sm btn-outline-secondary">
          {btnTitle}
        </Link>
      </div>
    );
  }

  render() {
    if (this.props.users.isLoading ||
        this.props.profiles.isLoading) {
      return <Loader />;
    }
    const query = new URLSearchParams(this.props.location.search);
    const editing = query.get('editing');

    const users = this.getUsers();
    const userRows = users.map(user => this.renderUser(user));
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
        {this.renderNewUserButton()}
        <UserModal
          isOpen={!!editing}
          user={null}
          onClose={this.handleUserModalClose}
          onConfirm={this.handleCreateUser} />
      </div>
    );
  }
}

DirectoryIndex.propTypes = {
  createInstances: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  profiles: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired
};
