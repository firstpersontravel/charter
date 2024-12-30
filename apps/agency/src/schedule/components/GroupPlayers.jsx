import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { PlayerCore, RoleCore } from 'fptcore';

import PopoverControl from '../../partials/PopoverControl';
import ScheduleUtils from '../utils';
import ParticipantModal from '../../directory/partials/ParticipantModal';
import { renderPlayLink, renderJoinLink } from '../../partials/links';

function truncate(msg, len) {
  return msg.length > len ? `${msg.slice(0, len)}...` : msg;
}

export default class GroupPlayers extends Component {
  constructor(props) {
    super(props);
    this.handleAssignParticipant = this.handleAssignParticipant.bind(this);
    this.handleParticipantModalClose = this.handleParticipantModalClose.bind(this);
    this.handleCreateParticipant = this.handleCreateParticipant.bind(this);
  }

  handleAssignParticipant(roleName, trip, player, participantId) {
    const participant = _.find(this.props.participants, { id: Number(participantId) });
    if (!player) {
      const initialFields = PlayerCore.getInitialFields(trip.script.content,
        roleName, trip.variantNames.split(','));
      const fields = Object.assign({
        orgId: trip.orgId,
        experienceId: trip.experienceId,
        tripId: trip.id,
        participantId: Number(participantId)
      }, initialFields);
      this.props.createInstance('players', fields);
      return;
    }
    // If it exists, update the player.
    const updateFields = { participantId: participant ? participant.id : null };
    this.props.updateInstance('players', player.id, updateFields);
  }

  handleParticipantModalClose() {
    this.props.history.push({ search: '' });
  }

  handleCreateParticipant(fields) {
    const query = new URLSearchParams(this.props.location.search);
    const roleName = query.get('role');
    if (!roleName) {
      return;
    }

    const trips = (this.props.group.trips || []).filter(trip => !trip.isArchived);
    const firstUnassignedPlayerForEachTrip = trips
      .map(t => t.players.find(p => p.roleName === roleName && !p.participantId))
      .filter(Boolean);

    const participantFields = {
      orgId: this.props.group.orgId,
      experienceId: this.props.group.experienceId,
      name: fields.name,
      phoneNumber: fields.phoneNumber,
      email: fields.email
    };

    // Create a profile for this new participant
    const nextItems = [{
      collection: 'profiles',
      fields: {
        orgId: this.props.group.orgId,
        experienceId: this.props.group.experienceId,
        roleName: roleName
      },
      insertions: { participantId: 'id' }
    }];

    // And assign up to one unassigned player with a matching role for each trip to this new
    // participant.
    nextItems.push(...firstUnassignedPlayerForEachTrip.map(player => ({
      collection: 'players',
      id: player.id,
      insertions: { participantId: 'id' }
    })));

    this.props.createInstances('participants', participantFields, nextItems);
    this.handleParticipantModalClose();
  }

  renderScheduleHeader(trip) {
    return (
      <th key={trip.id}>
        {trip.title}
      </th>
    );
  }

  renderPlayerCell(roleName, trip, player) {
    const group = this.props.group;
    const experience = this.props.group.experience;
    const script = this.props.group.script;

    const role = _.find(script.content.roles, { name: roleName });
    const participantIdsAlreadyChosen = _.filter(trip.players, { roleName: roleName })
      .filter(p => p !== player)
      .map(p => p.participant)
      .filter(Boolean)
      .map(participant => participant.id);
    const participant = player && player.participant;

    let participantLabel = 'Unassigned';
    let participantClass = 'faint';
    let participantId = '';

    if (participant) {
      participantLabel = truncate(participant.name, 10);
      participantId = participant.id;
      participantClass = 'constrain-text';
    }

    const profileChoices = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.participants, experience.id, roleName);
    const participantChoices = profileChoices
      .map(profile => (
        _.find(this.props.participants, { id: profile.participantId })
      ))
      .filter(Boolean)
      .filter(profileParticipant => (
        !participantIdsAlreadyChosen.includes(profileParticipant.id)
      ))
      .map(profileParticipant => ({
        value: profileParticipant.id,
        label: profileParticipant.name
      }));

    const playLink = renderPlayLink(trip, player);
    const joinLink = renderJoinLink(trip, player);

    if (participantChoices.length === 0) {
      return (
        <span>
          {playLink} <em className="faint">No participants</em> {joinLink}
        </span>
      );
    }

    const participantChoicesWithNone = [{ value: '', label: 'Unassigned' }]
      .concat(participantChoices);
    const goToParticipant = participant ? (
      <Link
        className="ml-1"
        to={`/${group.org.name}/${group.experience.name}/directory/${participant.id}`}>
        <i className="fa fa-user text-dark" />
      </Link>
    ) : null;

    const canEdit = !group.isArchived && !trip.isArchived;
    const participantControl = canEdit ? (
      <PopoverControl
        title={role.title}
        choices={participantChoicesWithNone}
        onConfirm={_.curry(this.handleAssignParticipant)(roleName, trip, player)}
        value={participantId}
        label={participantLabel}
        labelClassName={participantClass} />
    ) : participantLabel;

    return (
      <div>
        {playLink} {participantControl}
        {goToParticipant} {participant ? null : joinLink}
      </div>
    );
  }

  renderRoleCell(roleName, trip) {
    const experience = this.props.group.experience;
    const script = this.props.group.script;
    if (!experience || !script) {
      return null;
    }
    const player = _.find(trip.players, { roleName: roleName });
    return this.renderPlayerCell(roleName, trip, player);
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
        <td>
          <Link
            className="p-1 text-dark"
            to={{ search: `?role=${role.name}` }}>
            <i className="fa fa-user-plus" />
          </Link>
        </td>
      </tr>
    );
  }

  renderRoleRows(trips) {
    const script = this.props.group.script;
    if (!script) {
      return null;
    }
    return (script.content.roles || [])
      .filter(role => RoleCore.canRoleHaveParticipant(script.content, role))
      .map(role => this.renderRoleRow(trips, role));
  }

  render() {
    const query = new URLSearchParams(this.props.location.search);
    const isCreatingParticipant = !!query.get('role');

    const trips = (this.props.group.trips || []).filter(trip => !trip.isArchived);
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
                <th />
              </tr>
            </thead>
            <tbody>
              {roleRows}
            </tbody>
          </table>
          <ParticipantModal
            isOpen={isCreatingParticipant}
            participant={null}
            onClose={this.handleParticipantModalClose}
            onConfirm={this.handleCreateParticipant} />
        </div>
      </div>
    );
  }
}

GroupPlayers.propTypes = {
  group: PropTypes.object.isRequired,
  participants: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  createInstances: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
