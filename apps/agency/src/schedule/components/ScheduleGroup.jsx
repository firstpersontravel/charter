import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IndexLink } from 'react-router';

import { TextUtil, TripCore, PlayerCore } from 'fptcore';

import { withLoader } from '../../loader-utils';
import AreYouSure from '../../partials/AreYouSure';
import TripModal from '../partials/TripModal';
import ScheduleUtils from '../utils';

class ScheduleGroup extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isArchivingGroup: null,
      isArchiveGroupModalOpen: false,
      isArchivingTrip: null,
      isArchiveTripModalOpen: false,
      isTripEditModalOpen: false,
      isEditingTrip: null,
      defaultTripDepartureName: null
    };
    this.handleArchiveGroup = this.handleArchiveGroup.bind(this);
    this.handleArchiveGroupToggle = this.handleArchiveGroupToggle.bind(this);
    this.handleArchiveGroupConfirm = this.handleArchiveGroupConfirm.bind(this);
    this.handleArchiveTrip = this.handleArchiveTrip.bind(this);
    this.handleArchiveTripToggle = this.handleArchiveTripToggle.bind(this);
    this.handleArchiveTripConfirm = this.handleArchiveTripConfirm.bind(this);
    this.handleEditTripToggle = this.handleEditTripToggle.bind(this);
    this.handleNewTrip = this.handleNewTrip.bind(this);
    this.handleEditTripConfirm = this.handleEditTripConfirm.bind(this);
  }

  handleArchiveGroup() {
    this.setState({
      isArchiveGroupModalOpen: true,
      isArchivingGroup: true
    });
  }

  handleArchiveGroupToggle() {
    this.setState({
      isArchiveGroupModalOpen: !this.state.isArchiveGroupModalOpen
    });
  }

  handleArchiveGroupConfirm() {
    const group = this.props.group;
    const newArchiveValue = !group.isArchived;
    this.props.updateInstance('groups', group.id, {
      isArchived: newArchiveValue
    });
    if (newArchiveValue === false) {
      // TODO - replace with bulk update
      group.trips.forEach(trip => (
        this.props.updateInstance('trips', trip.id, { isArchived: true })
      ));
    }
    this.setState({
      isArchiveGroupModalOpen: false,
      isArchivingGroup: null
    });
  }

  handleArchiveTrip(trip) {
    this.setState({
      isArchiveTripModalOpen: true,
      isArchivingTrip: trip
    });
  }

  handleArchiveTripToggle() {
    this.setState({
      isArchiveTripModalOpen: !this.state.isArchiveTripModalOpen
    });
  }

  handleArchiveTripConfirm() {
    const trip = this.state.isArchivingTrip;
    this.props.updateInstance('trips', trip.id, {
      isArchived: !trip.isArchived
    });
    this.setState({
      isArchiveTripModalOpen: false,
      isArchivingTrip: null
    });
  }

  handleEditTripToggle() {
    this.setState({
      isTripEditModalOpen: !this.state.isTripEditModalOpen
    });
  }

  handleNewTrip(defaultDepartureName) {
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: null,
      defaultTripDepartureName: defaultDepartureName
    });
  }

  handleEditTrip(trip) {
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: trip,
      defaultTripDepartureName: null
    });
  }

  initialFieldsForRole(experience, script, role, departureName, variantNames) {
    const profiles = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.users, experience.id,
      role.name, departureName);
    const users = profiles.map(profile => (
      _.find(this.props.users, { id: profile.userId })
    ));
    const userId = users.length === 1 ? users[0].id : null;
    const fields = Object.assign(
      { orgId: experience.orgId, userId: userId },
      PlayerCore.getInitialFields(script.content, role.name, variantNames));
    return fields;
  }

  handleEditTripConfirm(group, fields) {
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
      galleryName: _.kebabCase(fields.title),
      departureName: fields.departureName,
      variantNames: fields.variantNames.join(','),
      currentSceneName: '',
      lastScheduledTime: null
    });
    const playersFields = group.script.content.roles.map(role => (
      this.initialFieldsForRole(group.experience, group.script,
        role, fields.departureName, fields.variantNames)
    ));
    if (this.state.isEditingTrip) {
      // update existing trip
      this.props.updateInstance('trips', this.state.isEditingTrip.id,
        tripFields);
      // TODO: update players too
    } else {
      // create new trip
      this.props.initializeTrip(tripFields, playersFields);
    }
    this.handleEditTripToggle();
  }

  renderTripRow(group, trip) {
    const editTripBtn = !group.isArchived ? (
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={() => this.handleEditTrip(trip)}>
        Edit
      </button>
    ) : null;
    const archiveTripBtn = !group.isArchived ? (
      <button
        style={{ marginLeft: '0.25em' }}
        className="btn btn-sm btn-outline-secondary"
        onClick={() => this.handleArchiveTrip(trip)}>
        {trip.isArchived ? 'Unarchive' : 'Archive'}
      </button>
    ) : null;

    return (
      <tr key={trip.id}>
        <td>
          <strong>{trip.departureName}</strong>
        </td>
        <td>
          <IndexLink to={`/${group.org.name}/${group.experience.name}/operate/${trip.groupId}/trip/${trip.id}`}>
            {trip.title}
          </IndexLink>
          {trip.isArchived && <i style={{ marginLeft: '0.25em' }} className="fa fa-archive" />}
        </td>
        <td>
          {trip.variantNames.split(',').filter(Boolean).map(TextUtil.titleForKey).join(', ')}
        </td>
        <td>
          {editTripBtn}
          {archiveTripBtn}
        </td>
      </tr>
    );
  }

  renderDepartureRow(group, departureName, trips) {
    const tripRows = trips
      .filter(trip => trip.departureName === departureName)
      .map(trip => this.renderTripRow(group, trip));

    return tripRows.length ?
      tripRows :
      this.renderNewTripRow(departureName);
  }

  renderHeader() {
    const group = this.props.group;
    const dateShort = moment(group.date).format('MMM D, YYYY');
    const hasTrips = group.trips.length > 0;
    const opsBtn = hasTrips ? (
      <IndexLink
        className={`btn ${group.isArchived ? 'btn-secondary' : 'btn-primary'} float-right`}
        to={
          `/${group.org.name}/${group.experience.name}` +
          `/operate/${group.id}`
        }>
        {dateShort} operations
      </IndexLink>
    ) : null;
    return (
      <div style={{ marginBottom: '1em' }}>
        {opsBtn}
        <h4>{dateShort}, script rev. {group.script.revision}</h4>
      </div>
    );
  }

  renderNewTripRow(departureName) {
    if (this.props.group.isArchived) {
      return null;
    }
    const departures = this.props.group.script.content.departures || [];
    const departureNames = departures.length > 0 ?
      _.map(departures, 'name') : [''];
    const defaultDepartureName = departureName || departureNames[0];
    return (
      <tr key={departureName}>
        <td>
          <strong>{departureName}</strong>
        </td>
        <td>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleNewTrip(defaultDepartureName)}>
            New trip
          </button>
        </td>
        <td />
        <td />
      </tr>
    );
  }

  renderTrips() {
    const group = this.props.group;
    const departures = group.script.content.departures || [];
    const departureNames = departures.length > 0 ?
      _.map(departures, 'name') : [''];
    const departureRows = departureNames.map((departureName) => {
      const depTrips = _.filter(group.trips, { departureName: departureName });
      return this.renderDepartureRow(group, departureName, depTrips);
    });
    const isFull = group.trips.length >= departureNames.length;
    const addTripRow = isFull ? this.renderNewTripRow('') : null;
    return (
      <table className="table table-striped">
        <tbody>
          {departureRows}
          {addTripRow}
        </tbody>
      </table>
    );
  }

  render() {
    if ((!this.props.group && this.props.group.isLoading) ||
        !this.props.group.script ||
        this.props.group.script.isNull) {
      return <div className="container-fluid">Loading</div>;
    }
    if (this.props.group.isError) {
      return <div className="container-fluid">Error</div>;
    }
    return (
      <div>
        {this.renderHeader()}
        {this.renderTrips()}

        <div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleArchiveGroup()}>
            {this.props.group.isArchived ? 'Unarchive' : 'Archive'} group
          </button>
        </div>

        <TripModal
          isOpen={this.state.isTripEditModalOpen}
          group={this.props.group}
          trip={this.state.isEditingTrip}
          defaultDepartureName={this.state.defaultTripDepartureName}
          onClose={this.handleEditTripToggle}
          onConfirm={this.handleEditTripConfirm} />
        <AreYouSure
          isOpen={this.state.isArchiveGroupModalOpen}
          onToggle={this.handleArchiveGroupToggle}
          onConfirm={this.handleArchiveGroupConfirm}
          message={`Are you sure you want to ${this.props.group.isArchived ? 'unarchive' : 'archive'} ${this.props.group.date} and all trips?`} />
        <AreYouSure
          isOpen={this.state.isArchiveTripModalOpen}
          onToggle={this.handleArchiveTripToggle}
          onConfirm={this.handleArchiveTripConfirm}
          message={`Are you sure you want to ${_.get(this.state.isArchivingTrip, 'isArchived') ? 'unarchive' : 'archive'} ${_.get(this.state.isArchivingTrip, 'departureName')}: ${_.get(this.state.isArchivingTrip, 'title')}?`} />
      </div>
    );
  }
}

ScheduleGroup.propTypes = {
  group: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  initializeTrip: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};

export default withLoader(ScheduleGroup, ['params.groupId'], (props) => {
  props.listCollection('trips', {
    groupId: props.params.groupId,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
  props.listCollection('groups', {
    id: props.params.groupId,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
});
