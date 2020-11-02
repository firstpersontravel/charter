import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import Loader from '../../partials/Loader';
import ParticipantModal from '../partials/ParticipantModal';

export default class DirectoryIndex extends Component {
  constructor(props) {
    super(props);
    this.handleCreateParticipant = this.handleCreateParticipant.bind(this);
    this.handleParticipantModalClose = this.handleParticipantModalClose.bind(this);
  }

  getParticipants() {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    return this.props.participants.filter((participant) => {
      if (roleName === 'Archived') {
        return participant.isArchived === true;
      }
      if (participant.isArchived) {
        return false;
      }
      const participantProfiles = _.filter(this.props.profiles, {
        participantId: participant.id
      });
      if (roleName) {
        const roleParams = { roleName: roleName };
        if (!_.find(participantProfiles, roleParams)) {
          return false;
        }
      }
      return true;
    });
  }

  handleCreateParticipant(fields) {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    const participantFields = {
      orgId: this.props.experience.orgId,
      experienceId: this.props.experience.id,
      name: fields.name,
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
        participantId: 'id'
      }
    }] : null;
    this.props.createInstances('participants', participantFields, profilesToCreate);
    this.handleParticipantModalClose();
  }

  handleParticipantModalClose() {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    const experience = this.props.experience;
    this.props.history.push(
      `/${experience.org.name}/${experience.name}/directory` +
      `${roleName ? `?role=${roleName}` : ''}`);
  }

  renderParticipant(participant) {
    const statusIcons = [];
    if (participant.locationTimestamp) {
      statusIcons.push(<i key="location" className="fa fa-location-arrow" />);
    }
    if (participant.devicePushToken) {
      statusIcons.push(<i key="comment" className="fa fa-comment" />);
    }
    const experience = this.props.experience;
    const profileParams = { participantId: participant.id };
    const participantProfiles = _(this.props.profiles)
      .filter(profileParams)
      .sortBy('isActive')
      .reverse()
      .value();
    const roleLinks = _.map(participantProfiles, profile => (
      <span key={profile.id}>
        <NavLink
          style={{
            textDecoration: profile.isActive ? '' : 'line-through'
          }}
          to={{
            pathname: `/${experience.org.name}/${experience.name}/directory`,
            search: `?role=${profile.roleName}`
          }}>
          {_.get(profile, 'role.title')}
        </NavLink>
        &nbsp;
      </span>
    ));
    return (
      <tr key={participant.id}>
        <td>
          <Link
            to={`/${experience.org.name}/${experience.name}/directory/${participant.id}`}>
            {participant.name}
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

  renderNewParticipantButton() {
    const experience = this.props.experience;
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    if (roleName === 'Archived') {
      return null;
    }
    const role = _.find(experience.script.content.roles, { name: roleName });
    const roleTitle = role && role.title;

    const btnTitle = roleName ? `New ${roleTitle} participant` : 'New participant';
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
    if (this.props.participants.isLoading ||
        this.props.profiles.isLoading) {
      return <Loader />;
    }
    const query = new URLSearchParams(this.props.location.search);
    const editing = query.get('editing');

    const participants = this.getParticipants();
    const participantRows = participants.map(p => this.renderParticipant(p));
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
            {participantRows}
          </tbody>
        </table>
        {this.renderNewParticipantButton()}
        <ParticipantModal
          isOpen={!!editing}
          participant={null}
          onClose={this.handleParticipantModalClose}
          onConfirm={this.handleCreateParticipant} />
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
  participants: PropTypes.array.isRequired
};
