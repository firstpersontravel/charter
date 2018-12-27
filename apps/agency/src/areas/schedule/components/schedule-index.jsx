import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IndexLink } from 'react-router';

import { TextCore, TripCore, PlayerCore } from 'fptcore';
import AreYouSure from '../../common/partials/AreYouSure';
import TripModal from '../partials/trip-modal';
import GroupModal from '../partials/group-modal';
import ScheduleUtils from '../utils';

export default class ScheduleIndex extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isArchivingGroup: null,
      isArchiveGroupModalOpen: false,
      isArchivingTrip: null,
      isArchiveTripModalOpen: false,
      isTripEditModalOpen: false,
      isEditingTrip: null,
      isGroupEditModalOpen: false,
      defaultGroupDate: null,
      defaultGroupScriptId: null,
      defaultTripGroup: null,
      defaultTripGroupScript: null,
      defaultTripScheduleName: null
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
    this.handleCreateGroup = this.handleCreateGroup.bind(this);
    this.handleEditGroupToggle = this.handleEditGroupToggle.bind(this);
  }

  componentDidMount() {
    this.props.listCollection('groups', { isArchived: false });
    this.props.listCollection('trips', { isArchived: false });
  }

  handleArchiveGroup(group) {
    this.setState({
      isArchiveGroupModalOpen: true,
      isArchivingGroup: group
    });
  }

  handleArchiveGroupToggle() {
    this.setState({
      isArchiveGroupModalOpen: !this.state.isArchiveGroupModalOpen
    });
  }

  handleArchiveGroupConfirm() {
    const group = this.state.isArchivingGroup;
    this.props.updateInstance('groups', group.id, {
      isArchived: true
    });
    const trips = _.filter(this.props.tripsStatus.instances,
      { groupId: group.id });

    trips.forEach(trip => (
      this.props.updateInstance('trips', trip.id, {
        isArchived: true
      })
    ));
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
      isArchived: true
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

  handleNewTrip(group, defaultDepartureName) {
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: null,
      defaultTripGroup: group,
      defaultTripScript: _.find(this.props.scripts, { id: group.scriptId }),
      defaultTripScheduleName: defaultDepartureName
    });
  }

  handleEditTrip(trip) {
    const group = _.find(this.props.groupsStatus.instances,
      { id: trip.groupId });
    const script = _.find(this.props.scripts, { id: trip.scriptId });
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: trip,
      defaultTripGroup: group,
      defaultTripScript: script,
      defaultTripScheduleName: null
    });
  }

  handleEditGroupToggle() {
    this.setState({
      isGroupEditModalOpen: !this.state.isGroupEditModalOpen
    });
  }

  handleCreateGroup(fields) {
    this.props.createInstance('groups', {
      date: fields.date,
      scriptId: fields.scriptId
    });
    this.handleEditGroupToggle();
  }

  initialFieldsForRole(script, role, departureName, variantNames) {
    const profiles = ScheduleUtils.filterAssignableProfiles(
      this.props.profiles, this.props.users, script.name,
      role.name, departureName);
    const users = profiles.map(profile => (
      _.find(this.props.users, { id: profile.userId })
    ));
    const userId = users.length === 1 ? users[0].id : null;
    const fields = Object.assign(
      { userId: userId },
      PlayerCore.getInitialFields(script, role.name, variantNames));
    return fields;
  }

  handleEditTripConfirm(group, fields) {
    const script = _.find(this.props.scripts, { id: group.scriptId });
    const initialFields = TripCore.getInitialFields(script, group.date,
      fields.variantNames);
    const tripFields = Object.assign(initialFields, {
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
    const playersFields = script.content.roles.map(role => (
      this.initialFieldsForRole(script, role, fields.departureName,
        fields.variantNames)
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

  renderCellForSchedule(group, departureName, trips) {
    const addButton = (
      <div key={departureName} className="row">
        <div className="col-sm-9">
          <strong>{departureName}</strong>{' '}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleNewTrip(group, departureName)}>
            New trip
          </button>
        </div>
      </div>
    );
    const tripElements = trips
      .filter(trip => trip.departureName === departureName)
      .map(trip => (
        <div key={trip.id} className="row">
          <div className="col-sm-4">
            <strong>{departureName}</strong>{' '}
            <IndexLink to={`/agency/live/${trip.groupId}/trip/${trip.id}`}>
              {trip.title}
            </IndexLink>
          </div>
          <div className="col-sm-4">
            {trip.variantNames.split(',').filter(Boolean).map(TextCore.titleForKey).join(', ')}
          </div>
          <div className="col-sm-4">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => this.handleEditTrip(trip)}>
              Edit
            </button>
            {' '}
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => this.handleArchiveTrip(trip)}>
              Archive
            </button>
          </div>
        </div>
      ));

    const cellContents = tripElements.length ?
      tripElements : addButton;

    return (
      <div key={departureName}>
        {cellContents}
      </div>
    );
  }

  renderGroup(group, script, trips) {
    const dateShort = moment(group.date).format('MMM D, YYYY');
    const departureNames = _.map(script.content.departures, 'name');
    const scheduleCells = departureNames.map(departureName =>
      this.renderCellForSchedule(group, departureName,
        _.filter(trips, { departureName: departureName })));

    return (
      <div key={group.id} className="row" style={{ borderBottom: '2px solid #ddd', paddingBottom: '0.5em', paddingTop: '0.5em' }}>
        <div className="col-sm-3">
          <strong>
            <IndexLink to={`/agency/live/${group.id}`}>
              {script.title}
            </IndexLink>
          </strong>
          <br />
          <IndexLink to={`/agency/live/${group.id}`}>
            {dateShort}
          </IndexLink>
          <br />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleArchiveGroup(group)}>
            Archive group
          </button>
        </div>
        <div className="col-sm-9">
          {scheduleCells}
        </div>
      </div>
    );
  }

  render() {
    if (this.props.scripts.length === 0 ||
        this.props.tripsStatus.isLoading ||
        this.props.groupsStatus.isLoading) {
      return <div>Loading</div>;
    }
    if (this.props.tripsStatus.isError ||
        this.props.groupsStatus.isError) {
      return <div>Error</div>;
    }
    const groups = this.props.groupsStatus.instances;
    const groupRows = _.map(groups, group => (
      this.renderGroup(group,
        _.find(this.props.scripts, { id: group.scriptId }),
        _.filter(this.props.tripsStatus.instances,
        { groupId: group.id }))
    ));
    return (
      <div>
        {groupRows}
        <div className="row" style={{ marginTop: '1em' }}>
          <div className="col-12">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={this.handleEditGroupToggle}>
              New group
            </button>
          </div>
        </div>
        <TripModal
          isOpen={this.state.isTripEditModalOpen}
          group={this.state.defaultTripGroup}
          script={this.state.defaultTripScript}
          trip={this.state.isEditingTrip}
          defaultDepartureName={this.state.defaultTripScheduleName}
          onClose={this.handleEditTripToggle}
          onConfirm={this.handleEditTripConfirm} />
        <GroupModal
          isOpen={this.state.isGroupEditModalOpen}
          scripts={this.props.scripts}
          defaultDate={this.state.defaultGroupDate}
          defaultScriptId={this.state.defaultGroupScriptId}
          onClose={this.handleEditGroupToggle}
          onConfirm={this.handleCreateGroup} />
        <AreYouSure
          isOpen={this.state.isArchiveGroupModalOpen}
          onToggle={this.handleArchiveGroupToggle}
          onConfirm={this.handleArchiveGroupConfirm}
          message={`Are you sure you want to archive ${_.get(this.state.isArchivingGroup, 'date')} and all trips?`} />
        <AreYouSure
          isOpen={this.state.isArchiveTripModalOpen}
          onToggle={this.handleArchiveTripToggle}
          onConfirm={this.handleArchiveTripConfirm}
          message={`Are you sure you want to archive ${_.get(this.state.isArchivingTrip, 'departureName')}: ${_.get(this.state.isArchivingTrip, 'title')}?`} />
      </div>
    );
  }
}

ScheduleIndex.propTypes = {
  scripts: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  groupsStatus: PropTypes.object.isRequired,
  tripsStatus: PropTypes.object.isRequired,
  initializeTrip: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
