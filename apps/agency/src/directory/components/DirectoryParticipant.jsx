import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import Loader from '../../partials/Loader';
import ParticipantModal from '../partials/ParticipantModal';
import ProfileModal from '../partials/ProfileModal';

export default class DirectoryParticipant extends Component {
  constructor(props) {
    super(props);
    this.handleParticipantToggleArchived = this.handleParticipantToggleArchived.bind(this);
    this.handleUpdateParticipant = this.handleUpdateParticipant.bind(this);
    this.handleParticipantModalClose = this.handleParticipantModalClose.bind(this);
    this.handleUpdateProfile = this.handleUpdateProfile.bind(this);
    this.handleProfileModalClose = this.handleProfileModalClose.bind(this);
    this.handleProfileToggleActive = this.handleProfileToggleActive.bind(this);
    this.handleProfileToggleArchived = this.handleProfileToggleArchived
      .bind(this);
  }

  componentDidMount() {
    this.loadData(this.props.match.params.participantId);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.participantId !== this.props.match.params.participantId) {
      this.loadData(this.props.match.params.participantId);
    }
  }

  loadData(participantId) {
    this.props.retrieveInstance('participants', participantId);
  }

  handleParticipantToggleArchived() {
    this.props.updateInstance('participants', this.props.participant.id, {
      isArchived: !this.props.participant.isArchived
    });
  }

  handleParticipantModalClose() {
    const { experience } = this.props;
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory`
      + `/${this.props.participant.id}`
    );
  }

  handleUpdateParticipant(fields) {
    this.props.updateInstance('participants', this.props.participant.id, {
      name: fields.name,
      phoneNumber: fields.phoneNumber,
      email: fields.email
    });
    this.handleParticipantModalClose();
  }

  handleProfileModalClose() {
    const { experience } = this.props;
    const query = new URLSearchParams(this.props.location.search);
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory`
      + `/${this.props.participant.id}`
      + `${query.get('archived_profiles') ? '?archived_profiles=true' : ''}`
    );
  }

  handleUpdateProfile(fields) {
    const query = new URLSearchParams(this.props.location.search);
    const editingProfileId = query.get('editing_profile');
    if (editingProfileId === 'new') {
      const create = Object.assign({}, fields, {
        orgId: this.props.experience.orgId,
        experienceId: this.props.experience.id,
        participantId: this.props.participant.id
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

  renderParticipantFields() {
    return (
      <p>
        <strong>Email:</strong>
        {' '}
        {this.props.participant.email}
        <br />
        <strong>Phone:</strong>
        &nbsp;
        {formatPhoneNumberIntl(this.props.participant.phoneNumber)}
        <br />
      </p>
    );
  }

  renderProfile(profile) {
    const query = new URLSearchParams(this.props.location.search);
    const archivedProfiles = query.get('archived_profiles');
    const { experience } = this.props;
    const { script } = experience;

    const role = _.find(script.content.roles, { name: profile.roleName });
    if (!role) {
      return null;
    }
    const requiredValues = role.role_values || [];
    const renderedValues = requiredValues
      .map(requiredValue => (
        <div key={requiredValue}>
          {requiredValue}
          :&nbsp;
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
          </span>
          &nbsp;
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${experience.org.name}/${experience.name}/directory/${this.props.participant.id}`,
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
    if (!this.props.participant) {
      return <div className="col-sm-9">User not found.</div>;
    }
    const query = new URLSearchParams(this.props.location.search);
    const archivedProfiles = query.get('archived_profiles');
    const editingProfileId = query.get('editing_profile');
    const isEditingParticipant = query.get('editing');
    const { experience } = this.props;
    const editingProfile = editingProfileId
      ? _.find(this.props.profiles, { id: Number(editingProfileId) })
      : null;
    const { participant } = this.props;
    const participantFields = this.renderParticipantFields();
    const profilesList = this.renderProfilesList();
    const hasAnyArchived = _.find(this.props.profiles, { isArchived: true });
    const isShowingArchived = !!archivedProfiles;
    const showArchivedButton = (hasAnyArchived && !isShowingArchived) ? (
      <span>
        &nbsp;
        <Link
          className="btn btn-sm btn-outline-secondary"
          to={`/${experience.org.name}/${experience.name}/directory/${participant.id}?archived_profiles=true`}>
          Show archived profiles
        </Link>
      </span>
    ) : null;
    return (
      <div className="col-sm-9">
        <h3>
          <Link to={`/${experience.org.name}/${experience.name}/directory`}>Directory</Link>
          {' '}
          &rsaquo;&nbsp;
          {participant.name}
        </h3>
        <p>
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={`/${experience.org.name}/${experience.name}/directory/${participant.id}?editing=true`}>
            Edit
          </Link>
          &nbsp;
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={this.handleParticipantToggleArchived}>
            {participant.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </p>
        {participantFields}
        {profilesList}
        <div className="mt-2">
          <Link
            className="btn btn-sm btn-outline-secondary"
            to={{
              pathname: `/${experience.org.name}/${experience.name}/directory/${participant.id}`,
              search: `?editing_profile=new&archived_profiles=${archivedProfiles}`
            }}>
            Create profile
          </Link>
          {showArchivedButton}
        </div>
        <ParticipantModal
          isOpen={!!isEditingParticipant}
          participant={participant}
          onClose={this.handleParticipantModalClose}
          onConfirm={this.handleUpdateParticipant} />
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

DirectoryParticipant.propTypes = {
  retrieveInstance: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  participant: PropTypes.object,
  experience: PropTypes.object.isRequired,
  profiles: PropTypes.array.isRequired
};

DirectoryParticipant.defaultProps = {
  participant: null
};
