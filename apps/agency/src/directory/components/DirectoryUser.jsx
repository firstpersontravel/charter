import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import UserModal from '../partials/UserModal';
import ProfileModal from '../partials/ProfileModal';

export default class DirectoryUser extends Component {

  constructor(props) {
    super(props);
    this.handleUserToggleArchived = this.handleUserToggleArchived.bind(this);
    this.handleUpdateUser = this.handleUpdateUser.bind(this);
    this.handleUserModalClose = this.handleUserModalClose.bind(this);
    this.handleUpdateProfile = this.handleUpdateProfile.bind(this);
    this.handleProfileModalClose = this.handleProfileModalClose.bind(this);
    this.handleProfileToggleActive = this.handleProfileToggleActive.bind(this);
    this.handleProfileToggleArchived = this.handleProfileToggleArchived
      .bind(this);
  }

  componentWillMount() {
    if (this.props.user && this.props.org) {
      this.loadPlayers(this.props.org.id, this.props.user.id);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.user || !nextProps.org) {
      return;
    }
    if (nextProps.user !== this.props.user ||
        nextProps.org !== this.props.org) {
      this.loadPlayers(nextProps.org.id, nextProps.user.id);
    }
  }

  loadPlayers(orgId, userId) {
    this.props.listCollection('players', { orgId: orgId, userId: userId });
  }

  handleUserToggleArchived() {
    this.props.updateInstance('users', this.props.user.id, {
      isArchived: !this.props.user.isArchived
    });
  }

  handleUserModalClose() {
    const orgName = this.props.params.orgName;
    browserHistory.push(`${orgName}/directory/user/${this.props.user.id}`);
  }

  handleUpdateUser(fields) {
    this.props.updateInstance('users', this.props.user.id, {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phoneNumber: fields.phoneNumber,
      email: fields.email
    });
    this.handleUserModalClose();
  }

  handleProfileModalClose() {
    const orgName = this.props.params.orgName;
    const query = this.props.location.query;
    browserHistory.push(
      `/${orgName}/directory/user/${this.props.user.id}` +
      `${query.archived_profiles ? '?archived_profiles=true' : ''}`
    );
  }

  handleUpdateProfile(fields) {
    const editingProfileId = this.props.location.query.editing_profile;
    if (editingProfileId === 'new') {
      const create = Object.assign({}, fields, { userId: this.props.user.id });
      this.props.createInstance('profiles', create);
    } else {
      // Replace to completely update values
      this.props.updateInstance('profiles', editingProfileId, fields);
    }
    this.handleProfileModalClose();
  }

  handleProfileToggleActive(profileId) {
    const profile = _.find(this.props.profiles, { id: profileId });
    this.props.updateInstance('profiles', profileId, {
      isActive: !profile.isActive
    });
  }

  handleProfileToggleArchived(profileId) {
    const profile = _.find(this.props.profiles, { id: profileId });
    this.props.updateInstance('profiles', profileId, {
      isArchived: !profile.isArchived
    });
  }

  renderUserFields() {
    return (
      <p>
        <strong>Email:</strong> {this.props.user.email}
        <br />
        <strong>Phone:</strong>
        &nbsp;{TextUtil.formatPhone(this.props.user.phoneNumber)}
        <br />
      </p>
    );
  }

  renderPlayerRole({ group, player, trip }) {
    const orgName = this.props.params.orgName;
    const groupLink = group ? (
      <span>
        <Link
          to={`/${orgName}/operate/${trip.groupId}`}>
          Group: {moment(group.date).format('MMM D')}
        </Link>
        {', '}
      </span>
    ) : null;
    return (
      <li key={player.id}>
        {groupLink}
        <Link
          to={`/${orgName}/operate/${trip.groupId}/all/role/${player.roleName}/${this.props.user.id}`}>
          Trip: {trip.title},
          Departure: {trip.departureName}
        </Link>
      </li>
    );
  }

  renderPlayers(profile) {
    const playerItems = this.props.activeRoles
      .filter(role => (
        role.experience &&
        role.experience.id === profile.experienceId &&
        role.player &&
        role.player.roleName === profile.roleName
      ))
      .map(role => this.renderPlayerRole(role));
    return (
      <ul>
        {playerItems}
      </ul>
    );
  }

  renderProfile(profile) {
    const orgName = this.props.params.orgName;
    const experience = _.find(this.props.experiences, {
      id: profile.experienceId
    });
    if (!experience) {
      return null;
    }
    const script = _.find(this.props.scripts, {
      experienceId: experience.id,
      isArchived: false
    });
    if (!script) {
      return null;
    }
    const photo = profile.photo ? (<div>Photo: {profile.photo}</div>) : null;
    const phone = profile.phoneNumber ?
      (<div>Phone: {profile.phoneNumber}</div>) : null;
    const skype = profile.skypeUsername ?
      (<div>Skype: {profile.skypeUsername}</div>) : null;
    const facetime = profile.facetimeUsername ?
      (<div>Facetime: {profile.facetimeUsername}</div>) : null;

    const role = _.find(script.content.roles, { name: profile.roleName });
    if (!role) {
      return null;
    }
    const requiredValues = role.required_values || [];
    const renderedValues = requiredValues
      .map(requiredValue => (
        <div key={requiredValue}>
          {requiredValue}:&nbsp;
          {profile.values[requiredValue] || <span className="text-danger">empty</span>}
        </div>
      ));
    const isActive = profile.isActive && !profile.isArchived;
    return (
      <div key={profile.id}>
        <div>
          <span className={isActive ? 'bold' : 'strikethrough'}>
            <Link to={`/${orgName}/directory?experienceId=${experience.id}`}>
              {experience.title}
            </Link>
            &nbsp;&bull;&nbsp;
            <Link to={`/${orgName}/directory?experienceId=${experience.id}&role=${role.name}`}>
              {role.name}
            </Link>
            {profile.departureName ? ` ${profile.departureName}` : null }
          </span>
          &nbsp;
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${orgName}//directory/user/${this.props.user.id}`,
              query: {
                editing_profile: profile.id,
                archived_profiles: this.props.location.query.archived_profiles
              }
            }}>
            Edit
          </Link>
          &nbsp;
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleProfileToggleActive(profile.id)}>
            {profile.isActive ? 'Deactivate' : 'Activate'}
          </button>
          &nbsp;
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleProfileToggleArchived(profile.id)}>
            {profile.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
        {photo}
        {phone}
        {skype}
        {facetime}
        {renderedValues}
        {this.renderPlayers(profile)}
      </div>
    );
  }

  renderProfilesList() {
    const isShowingArchived = !!this.props.location.query.archived_profiles;
    return _(this.props.profiles)
      .filter(profile => isShowingArchived || !profile.isArchived)
      .sort(profile => !profile.isActive)
      .map(profile => this.renderProfile(profile))
      .value();
  }

  render() {
    if (!this.props.scripts.length) {
      return <div className="col-sm-9">Loading</div>;
    }
    if (!this.props.user) {
      return <div className="col-sm-9">Error</div>;
    }
    const orgName = this.props.params.orgName;
    const editingProfileId = this.props.location.query.editing_profile;
    const editingProfile = editingProfileId ?
      _.find(this.props.profiles, { id: Number(editingProfileId) }) :
      null;
    const user = this.props.user;
    const userFields = this.renderUserFields();
    const profilesList = this.renderProfilesList();
    const hasAnyArchived = _.find(this.props.profiles, { isArchived: true });
    const isShowingArchived = !!this.props.location.query.archived_profiles;
    const showArchivedButton = (hasAnyArchived && !isShowingArchived) ? (
      <span>
        &nbsp;
        <Link
          className="btn btn-sm btn-outline-secondary"
          to={`/${orgName}/directory/user/${user.id}?archived_profiles=true`}>
          Show archived profiles
        </Link>
      </span>
    ) : null;
    return (
      <div className="col-sm-9">
        <h3>
          <Link to={`/${orgName}/directory`}>Directory</Link> &rsaquo;&nbsp;
          {user.firstName} {user.lastName}
        </h3>
        <p>
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={`/${orgName}/directory/user/${user.id}?editing=true`}>
            Edit
          </Link>
          &nbsp;
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={this.handleUserToggleArchived}>
            {user.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </p>
        {userFields}
        {profilesList}
        <div>
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${orgName}/directory/user/${user.id}`,
              query: {
                editing_profile: 'new',
                archived_profiles: this.props.location.query.archived_profiles
              }
            }}>
            Create profile
          </Link>
          {showArchivedButton}
        </div>
        <UserModal
          isOpen={!!this.props.location.query.editing}
          user={user}
          onClose={this.handleUserModalClose}
          onConfirm={this.handleUpdateUser} />
        <ProfileModal
          isOpen={!!editingProfileId}
          experiences={this.props.experiences}
          scripts={this.props.scripts}
          profile={editingProfile}
          onClose={this.handleProfileModalClose}
          onConfirm={this.handleUpdateProfile} />
      </div>
    );
  }
}

DirectoryUser.propTypes = {
  listCollection: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  activeRoles: PropTypes.array.isRequired,
  org: PropTypes.object.isRequired,
  user: PropTypes.object,
  experiences: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired,
  scripts: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired
};

DirectoryUser.defaultProps = {
  user: null
};
