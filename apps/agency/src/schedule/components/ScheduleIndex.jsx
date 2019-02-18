import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IndexLink } from 'react-router';

import { TextUtil, TripCore, PlayerCore } from 'fptcore';

import { withLoader } from '../../loader-utils';
import AreYouSure from '../../partials/AreYouSure';
import TripModal from '../partials/TripModal';
import GroupModal from '../partials/GroupModal';
import ScheduleUtils from '../utils';
import { getStage } from '../../utils';

class ScheduleIndex extends Component {

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
      defaultGroupExperienceId: null,
      defaultTripGroup: null,
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
    this.handleCreateGroup = this.handleCreateGroup.bind(this);
    this.handleEditGroupToggle = this.handleEditGroupToggle.bind(this);
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
    this.props.updateInstance('groups', group.id, { isArchived: true });
    group.trips.forEach(trip => (
      this.props.updateInstance('trips', trip.id, { isArchived: true })
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
    this.props.updateInstance('trips', trip.id, { isArchived: true });
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
      defaultTripDepartureName: defaultDepartureName
    });
  }

  handleEditTrip(trip) {
    const group = _.find(this.props.groups, { id: trip.groupId });
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: trip,
      defaultTripGroup: group,
      defaultTripDepartureName: null
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
      orgId: this.props.org.id,
      experienceId: this.props.experience.id,
      scriptId: fields.scriptId
    });
    this.handleEditGroupToggle();
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

  renderCellForDeparture(group, departureName, trips) {
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
            <IndexLink to={`/${group.org.name}/${group.experience.name}/operate/${trip.groupId}/trip/${trip.id}`}>
              {trip.title}
            </IndexLink>
          </div>
          <div className="col-sm-4">
            {trip.variantNames.split(',').filter(Boolean).map(TextUtil.titleForKey).join(', ')}
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

  renderGroup(group) {
    if (group.script.isNull) {
      return null;
    }
    const dateShort = moment(group.date).format('MMM D, YYYY');
    const departures = group.script.content.departures || [];
    const departureNames = departures.length > 0 ?
      _.map(departures, 'name') : [''];
    const departureCells = departureNames.map((departureName) => {
      const depTrips = _.filter(group.trips, { departureName: departureName });
      return this.renderCellForDeparture(group, departureName, depTrips);
    });

    return (
      <div key={group.id} className="row" style={{ borderBottom: '2px solid #ddd', paddingBottom: '0.5em', paddingTop: '0.5em' }}>
        <div className="col-sm-3">
          <IndexLink
            to={
              `/${group.org.name}/${group.experience.name}` +
              `/operate/${group.id}`
            }>
            <h4>{dateShort}</h4>
          </IndexLink>
          <div>Script rev. {group.script.revision}</div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => this.handleArchiveGroup(group)}>
            Archive group
          </button>
        </div>
        <div className="col-sm-9">
          {departureCells}
        </div>
      </div>
    );
  }

  renderTrailhead() {
    const activeScript = _.find(this.props.scripts, { isActive: true });
    const trailheadSpecs = _.filter(_.get(activeScript, 'content.relays'), {
      trailhead: true
    });
    if (!trailheadSpecs.length) {
      return null;
    }
    let hasUnallocated = false;
    const renderedTrailheads = trailheadSpecs.map((trailhead) => {
      const relay = _.find(this.props.experience.relays, {
        forRoleName: trailhead.for,
        asRoleName: trailhead.as,
        withRoleName: trailhead.with,
        userPhoneNumber: ''
      });
      if (!relay) {
        hasUnallocated = true;
      }
      const forRole = _.find(activeScript.content.roles,
        { name: trailhead.for });
      return (
        <span key={trailhead.name}>
          {forRole.title}: {relay ?
            TextUtil.formatPhone(relay.relayPhoneNumber) :
            '(not yet allocated)'}
        </span>
      );
    });

    const allocateRelaysBtn = hasUnallocated ? (
      <button
        style={{ marginLeft: '1em' }}
        disabled={this.props.systemActionRequestState === 'pending'}
        className="btn btn-primary"
        onClick={() => this.props.updateRelays(
          this.props.org.id, this.props.experience.id)}>
        Allocate phone numbers
      </button>
    ) : null;

    return (
      <div className="alert alert-info">
        Trips can be started through calls or texts to trailhead numbers. {renderedTrailheads}
        {allocateRelaysBtn}
      </div>
    );
  }

  render() {
    if (this.props.groups.isLoading) {
      return <div className="container-fluid">Loading</div>;
    }
    if (this.props.groups.isError) {
      return <div className="container-fluid">Error</div>;
    }
    const groupRows = _.map(this.props.groups, group => (
      this.renderGroup(group)
    ));
    return (
      <div className="container-fluid">
        {this.renderTrailhead()}
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
          trip={this.state.isEditingTrip}
          defaultDepartureName={this.state.defaultTripDepartureName}
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
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired,
  scripts: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  initializeTrip: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired,
  systemActionRequestState: PropTypes.string
};

ScheduleIndex.defaultProps = {
  systemActionRequestState: null
};

export default withLoader(ScheduleIndex, ['experience.id'], (props) => {
  props.listCollection('scripts', {
    isArchived: false,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
  props.listCollection('trips', {
    isArchived: false,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
  props.listCollection('groups', {
    isArchived: false,
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
  props.listCollection('relays', {
    orgId: props.experience.orgId,
    experienceId: props.experience.id,
    stage: getStage(),
    userPhoneNumber: ''
  });
});
