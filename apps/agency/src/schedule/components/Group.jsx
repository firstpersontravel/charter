import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NavLink, Link } from 'react-router-dom';

import { TextUtil, TripCore, PlayerCore } from 'fptcore';

import Alert from '../../partials/Alert';
import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';
import TripModal from '../partials/TripModal';
import ScheduleUtils from '../utils';

class Group extends Component {
  constructor(props) {
    super(props);
    this.handleArchiveGroup = this.handleArchiveGroup.bind(this);
    this.handleArchiveTrip = this.handleArchiveTrip.bind(this);
    this.handleEditTripClose = this.handleEditTripClose.bind(this);
    this.handleEditTrip = this.handleEditTrip.bind(this);
  }

  handleArchiveGroup() {
    const group = this.props.group;
    const newArchiveValue = !group.isArchived;
    this.props.updateInstance('groups', group.id, {
      isArchived: newArchiveValue
    });
    this.props.bulkUpdate('trips', {
      orgId: group.orgId,
      experienceId: group.experienceId,
      groupId: group.id
    }, {
      isArchived: newArchiveValue
    });
  }

  handleArchiveTrip(trip) {
    this.props.updateInstance('trips', trip.id, {
      isArchived: !trip.isArchived
    });
  }

  handleEditTripClose() {
    this.props.history.push({ search: '' });
  }

  initialFieldsForRole(experience, script, role, variantNames) {
    const profiles = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.participants, experience.id,
      role.name);

    const participants = profiles
      .filter(profile => !!profile.participantId)
      .map(profile => _.find(this.props.participants, { id: profile.participantId }))
      .filter(Boolean);

    const participantId = participants.length === 1 ? participants[0].id : null;
    const fields = Object.assign({
      orgId: experience.orgId,
      experienceId: experience.id,
      participantId: participantId
    }, PlayerCore.getInitialFields(script.content, role.name, variantNames));
    return fields;
  }

  handleEditTrip(group, fields) {
    const initialFields = TripCore.getInitialFields(
      group.script.content, group.date,
      group.experience.timezone, fields.variantNames);
    const tripFields = Object.assign(initialFields, {
      orgId: group.orgId,
      experienceId: group.experienceId,
      groupId: group.id,
      scriptId: group.scriptId,
      date: group.date,
      title: fields.title,
      variantNames: fields.variantNames.join(','),
      tripState: { currentSceneName: '' }
    });

    const query = new URLSearchParams(this.props.location.search);
    const editingTripId = query.get('trip');
    if (editingTripId !== 'new') {
      // update existing trip
      this.props.updateInstance('trips', editingTripId, tripFields);
    } else {
      // create new trip
      this.initializeTrip(group, tripFields);
    }
    this.handleEditTripClose();
  }

  initializeTrip(group, tripFields) {
    const roles = group.script.content.roles || [];
    this.props.createTrip(tripFields, roles.map(role => ({
      collection: 'players',
      fields: this.initialFieldsForRole(group.experience, group.script,
        role, tripFields.variantNames.split(',')),
      insertions: { tripId: 'id' }
    })));
    this.props.trackEvent('Created a run');
  }

  renderTripRow(group, trip) {
    const editTripBtn = !group.isArchived ? (
      <Link
        className="btn btn-sm btn-outline-secondary"
        to={{ search: `?trip=${trip.id}` }}>
        Edit
      </Link>
    ) : null;
    const archiveTripBtn = !group.isArchived ? (
      <button
        className="btn btn-sm btn-outline-secondary ml-1"
        onClick={() => this.handleArchiveTrip(trip)}>
        {trip.isArchived ? 'Unarchive' : 'Archive'}
      </button>
    ) : null;

    const archivedStyle = { textDecoration: 'line-through' };
    return (
      <tr key={trip.id}>
        <td style={trip.isArchived ? archivedStyle : null}>
          <Link to={`/${group.org.name}/${group.experience.name}/operate/trip/${trip.id}`}>
            <strong>{trip.title}</strong>
          </Link>
          {trip.isArchived && <i className="fa fa-archive ml-1" />}
        </td>
        <td>
          {trip.variantNames.split(',').filter(Boolean).map(TextUtil.titleForKey).join(', ')}
        </td>
        <td className="text-right">
          {editTripBtn}
          {archiveTripBtn}
        </td>
      </tr>
    );
  }

  renderHeader() {
    const group = this.props.group;
    const dateShort = moment(group.date).format('MMM D');
    return (
      <div className="mb-3">
        <div className="float-right text-right">
          <Link
            className="btn btn-outline-secondary"
            to={{ search: '?trip=new' }}>
            Add run
          </Link>
          &nbsp;
          <button
            className="btn btn-outline-secondary"
            onClick={() => this.handleArchiveGroup()}>
            {this.props.group.isArchived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
        <h4>{dateShort}</h4>
      </div>
    );
  }

  renderTrips() {
    if (!this.props.group.trips.length) {
      return (
        <div style={{ padding: '100px' }}>
          <Link
            className={`btn btn-block btn-primary ${this.props.group.isArchived ? 'disabled' : ''}`}
            to={{ search: '?trip=new' }}>
            Add a run to this run group
          </Link>
        </div>
      );
    }
    const group = this.props.group;
    const tripRows = _(this.props.group.trips)
      .sortBy(trip => [trip.isArchived, trip.title])
      .map(trip => this.renderTripRow(group, trip))
      .value();
    return (
      <table className="table table-striped">
        <tbody>
          {tripRows}
        </tbody>
      </table>
    );
  }

  renderTabs() {
    const group = this.props.group;
    return (
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <NavLink
            className="nav-link"
            activeClassName="active"
            to={`/${group.org.name}/${group.experience.name}/schedule/${this.props.match.params.year}/${this.props.match.params.month}/${group.id}`}>
            Users
          </NavLink>
        </li>
      </ul>
    );
  }

  renderTripsDetail() {
    if (!this.props.group.trips || !this.props.group.trips.length) {
      return null;
    }
    return (
      <div>
        {this.renderTabs()}
        {this.props.children}
      </div>
    );
  }

  render() {
    if (!this.props.group.isLoading && (this.props.group.isError || this.props.group.isNull)) {
      return <Alert color="danger" content="Error loading group." />;
    }
    if ((!this.props.group && this.props.group.isLoading) ||
        !this.props.group.script ||
        this.props.group.script.isNull) {
      return <Loader />;
    }

    const query = new URLSearchParams(this.props.location.search);
    const editingTripId = query.get('trip');
    const isEditingTrip = !!editingTripId;
    const editingTrip = (isEditingTrip && editingTripId !== 'new') ?
      this.props.group.trips.find(t => t.id === Number(editingTripId)) :
      null;

    return (
      <div>
        {this.renderHeader()}
        {this.renderTrips()}
        {this.renderTripsDetail()}
        <TripModal
          isOpen={isEditingTrip}
          group={this.props.group}
          trip={editingTrip}
          onClose={this.handleEditTripClose}
          onConfirm={this.handleEditTrip} />
      </div>
    );
  }
}

Group.propTypes = {
  group: PropTypes.object.isRequired,
  participants: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  createTrip: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  bulkUpdate: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  trackEvent: PropTypes.func.isRequired
};

const loadProps = ['match.params.groupId', 'group.trips.length'];
export default withLoader(Group, loadProps, (props) => {
  if (props.group.id && props.group.trips.length) {
    props.listCollection('players', {
      tripId: props.group.trips.map(trip => trip.id).join(','),
      orgId: props.experience.orgId
    });
    props.listCollection('scripts', {
      id: props.group.scriptId,
      experienceId: props.experience.id,
      orgId: props.experience.orgId
    });
  }
  props.listCollection('trips', {
    groupId: props.match.params.groupId,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
  props.listCollection('groups', {
    id: props.match.params.groupId,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
});
