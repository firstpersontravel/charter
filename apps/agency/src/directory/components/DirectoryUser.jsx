import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { TextUtil } from 'fptcore';

import Loader from '../../partials/Loader';
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
    this.loadData(this.props.match.params.userId);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.userId !== this.props.match.params.userId) {
      this.loadData(nextProps.match.params.userId);
    }
  }

  loadData(userId) {
    this.props.retrieveInstance('users', userId);
  }

  handleUserToggleArchived() {
    this.props.updateInstance('users', this.props.user.id, {
      isArchived: !this.props.user.isArchived
    });
  }

  handleUserModalClose() {
    const experience = this.props.experience;
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory` +
      `/user/${this.props.user.id}`);
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
    const experience = this.props.experience;
    const query = new URLSearchParams(this.props.location.search);
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory` +
      `/user/${this.props.user.id}` +
      `${query.get('archived_profiles') ? '?archived_profiles=true' : ''}`);
  }

  handleUpdateProfile(fields) {
    const query = new URLSearchParams(this.props.location.search);
    const editingProfileId = query.get('editing_profile');
    if (editingProfileId === 'new') {
      const create = Object.assign({}, fields, {
        orgId: this.props.experience.orgId,
        experienceId: this.props.experience.id,
        userId: this.props.user.id
      });
      this.props.createInstance('profiles', create);
    } else {
      // Replace to completely update values
      this.props.updateInstance('profiles', Number(editingProfileId), fields);
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

  renderProfile(profile) {
    const query = new URLSearchParams(this.props.location.search);
    const archivedProfiles = query.get('archived_profiles');
    const experience = this.props.experience;
    const script = experience.script;
    const photo = profile.photo ? (<div>Photo: {profile.photo}</div>) : null;
    const email = profile.email ?
      (<div>Email: {profile.email}</div>) : null;
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
            <Link to={`/${experience.org.name}/${experience.name}/directory?role=${role.name}`}>
              {role.title}
            </Link>
            {profile.departureName ? ` ${profile.departureName}` : null }
          </span>
          &nbsp;
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${experience.org.name}/${experience.name}/directory/user/${this.props.user.id}`,
              search: `?editing_profile=${profile.id}&archived_profiles=${archivedProfiles}`
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
        {email}
        {phone}
        {skype}
        {facetime}
        {renderedValues}
      </div>
    );
  }

  renderProfilesList() {
    const query = new URLSearchParams(this.props.location.search);
    const archivedProfiles = query.get('archived_profiles');
    const isShowingArchived = !!archivedProfiles;
    return _(this.props.profiles)
      .filter(profile => isShowingArchived || !profile.isArchived)
      .sort(profile => !profile.isActive)
      .map(profile => this.renderProfile(profile))
      .value();
  }

  render() {
    if (!this.props.experience.script) {
      return <div className="col-sm-9"><Loader /></div>;
    }
    if (!this.props.user) {
      return <div className="col-sm-9">User not found.</div>;
    }
    const query = new URLSearchParams(this.props.location.search);
    const archivedProfiles = query.get('archived_profiles');
    const editingProfileId = query.get('editing_profile');
    const isEditingUser = query.get('editing');
    const experience = this.props.experience;
    const editingProfile = editingProfileId ?
      _.find(this.props.profiles, { id: Number(editingProfileId) }) :
      null;
    const user = this.props.user;
    const userFields = this.renderUserFields();
    const profilesList = this.renderProfilesList();
    const hasAnyArchived = _.find(this.props.profiles, { isArchived: true });
    const isShowingArchived = !!archivedProfiles;
    const showArchivedButton = (hasAnyArchived && !isShowingArchived) ? (
      <span>
        &nbsp;
        <Link
          className="btn btn-sm btn-outline-secondary"
          to={`/${experience.org.name}/${experience.name}/directory/user/${user.id}?archived_profiles=true`}>
          Show archived profiles
        </Link>
      </span>
    ) : null;
    return (
      <div className="col-sm-9">
        <h3>
          <Link to={`/${experience.org.name}/${experience.name}/directory`}>Directory</Link> &rsaquo;&nbsp;
          {user.firstName} {user.lastName}
        </h3>
        <p>
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={`/${experience.org.name}/${experience.name}/directory/user/${user.id}?editing=true`}>
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
        <div className="mt-2">
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${experience.org.name}/${experience.name}/directory/user/${user.id}`,
              search: `?editing_profile=new&archived_profiles=${archivedProfiles}`
            }}>
            Create profile
          </Link>
          {showArchivedButton}
        </div>
        <UserModal
          isOpen={!!isEditingUser}
          user={user}
          onClose={this.handleUserModalClose}
          onConfirm={this.handleUpdateUser} />
        <ProfileModal
          isOpen={!!editingProfileId}
          experience={this.props.experience}
          profile={editingProfile}
          onClose={this.handleProfileModalClose}
          onConfirm={this.handleUpdateProfile} />
      </div>
    );
  }
}

DirectoryUser.propTypes = {
  retrieveInstance: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  user: PropTypes.object,
  experience: PropTypes.object.isRequired,
  profiles: PropTypes.array.isRequired
};

DirectoryUser.defaultProps = {
  user: null
};
