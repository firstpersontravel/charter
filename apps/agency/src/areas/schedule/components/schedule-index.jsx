import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IndexLink } from 'react-router';

import { TextCore, PlaythroughCore, ParticipantCore } from 'fptcore';
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
      isArchivingPlaythrough: null,
      isArchivePlaythroughModalOpen: false,
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
    this.props.listCollection('playthroughs', { isArchived: false });
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
    const playthroughs = _.filter(this.props.playthroughsStatus.instances,
      { groupId: group.id });

    playthroughs.forEach(playthrough => (
      this.props.updateInstance('playthroughs', playthrough.id, {
        isArchived: true
      })
    ));
    this.setState({
      isArchiveGroupModalOpen: false,
      isArchivingGroup: null
    });
  }

  handleArchiveTrip(playthrough) {
    this.setState({
      isArchivePlaythroughModalOpen: true,
      isArchivingPlaythrough: playthrough
    });
  }

  handleArchiveTripToggle() {
    this.setState({
      isArchivePlaythroughModalOpen: !this.state.isArchivePlaythroughModalOpen
    });
  }

  handleArchiveTripConfirm() {
    const playthrough = this.state.isArchivingPlaythrough;
    this.props.updateInstance('playthroughs', playthrough.id, {
      isArchived: true
    });
    this.setState({
      isArchivePlaythroughModalOpen: false,
      isArchivingPlaythrough: null
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

  handleEditTrip(playthrough) {
    const group = _.find(this.props.groupsStatus.instances,
      { id: playthrough.groupId });
    const script = _.find(this.props.scripts, { id: playthrough.scriptId });
    this.setState({
      isTripEditModalOpen: true,
      isEditingTrip: playthrough,
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
      ParticipantCore.getInitialFields(script, role.name, variantNames));
    return fields;
  }

  handleEditTripConfirm(group, fields) {
    const script = _.find(this.props.scripts, { id: group.scriptId });
    const values = PlaythroughCore.getInitialValues(script, fields.variantNames);
    const schedule = PlaythroughCore.getInitialSchedule(script,
      group.date, fields.variantNames);
    const playthroughFields = {
      groupId: group.id,
      scriptId: group.scriptId,
      date: group.date,
      title: fields.title,
      galleryName: _.kebabCase(fields.title),
      departureName: fields.departureName,
      variantNames: fields.variantNames.join(','),
      currentSceneName: '',
      values: values,
      schedule: schedule,
      lastScheduledTime: null
    };
    const participantsFields = script.content.roles.map(role => (
      this.initialFieldsForRole(script, role, fields.departureName,
        fields.variantNames)
    ));
    if (this.state.isEditingTrip) {
      // update existing trip
      this.props.updateInstance('playthroughs', this.state.isEditingTrip.id,
        playthroughFields);
      // TODO: update participants too
    } else {
      // create new trip
      this.props.initializePlaythrough(playthroughFields, participantsFields);
    }
    this.handleEditTripToggle();
  }

  renderCellForSchedule(group, departureName, playthroughs) {
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
    const playthroughElements = playthroughs
      .filter(playthrough => playthrough.departureName === departureName)
      .map(playthrough => (
        <div key={playthrough.id} className="row">
          <div className="col-sm-4">
            <strong>{departureName}</strong>{' '}
            <IndexLink to={`/agency/live/${playthrough.groupId}/trip/${playthrough.id}`}>
              {playthrough.title}
            </IndexLink>
          </div>
          <div className="col-sm-4">
            {playthrough.variantNames.split(',').filter(Boolean).map(TextCore.titleForKey).join(', ')}
          </div>
          <div className="col-sm-4">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => this.handleEditTrip(playthrough)}>
              Edit
            </button>
            {' '}
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => this.handleArchiveTrip(playthrough)}>
              Archive
            </button>
          </div>
        </div>
      ));

    const cellContents = playthroughElements.length ?
      playthroughElements : addButton;

    return (
      <div key={departureName}>
        {cellContents}
      </div>
    );
  }

  renderGroup(group, script, playthroughs) {
    const dateShort = moment(group.date).format('MMM D, YYYY');
    const departureNames = _.map(script.content.departures, 'name');
    const scheduleCells = departureNames.map(departureName =>
      this.renderCellForSchedule(group, departureName,
        _.filter(playthroughs, { departureName: departureName })));

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
        this.props.playthroughsStatus.isLoading ||
        this.props.groupsStatus.isLoading) {
      return <div>Loading</div>;
    }
    if (this.props.playthroughsStatus.isError ||
        this.props.groupsStatus.isError) {
      return <div>Error</div>;
    }
    const groups = this.props.groupsStatus.instances;
    const groupRows = _.map(groups, group => (
      this.renderGroup(group,
        _.find(this.props.scripts, { id: group.scriptId }),
        _.filter(this.props.playthroughsStatus.instances,
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
          playthrough={this.state.isEditingTrip}
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
          message={`Are you sure you want to archive ${_.get(this.state.isArchivingGroup, 'date')} and all playthroughs?`} />
        <AreYouSure
          isOpen={this.state.isArchivePlaythroughModalOpen}
          onToggle={this.handleArchiveTripToggle}
          onConfirm={this.handleArchiveTripConfirm}
          message={`Are you sure you want to archive ${_.get(this.state.isArchivingPlaythrough, 'departureName')}: ${_.get(this.state.isArchivingPlaythrough, 'title')}?`} />
      </div>
    );
  }
}

ScheduleIndex.propTypes = {
  scripts: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  groupsStatus: PropTypes.object.isRequired,
  playthroughsStatus: PropTypes.object.isRequired,
  initializePlaythrough: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
