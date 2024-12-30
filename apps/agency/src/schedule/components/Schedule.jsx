import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import { PlayerCore, TextUtil, TripCore } from 'fptcore';

import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';
import TripModal from '../partials/TripModal';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';
import { getStage } from '../../utils';
import ScheduleUtils from '../utils';

function renderEntrywayRelay(
  org, experience, script, assignTempRelayEntryway, systemActionRequestState
) {
  const entrywaySpec = _.find(_.get(script, 'content.relays'), { entryway: true });
  if (!entrywaySpec) {
    return (
      <div>
        <i className="fa fa-phone mr-1" />
        Runs cannot be created by text or call because no entryway phone line exists.
      </div>
    );
  }
  const entrywayForRole = _.find(_.get(script, 'content.roles'), { name: entrywaySpec.for });
  const entrywayWithRole = _.find(_.get(script, 'content.roles'), { name: entrywaySpec.with });
  const relayEntryway = _.find(experience.relayEntryways, {});
  if (!relayEntryway) {
    return (
      <div>
        <i className="fa fa-phone mr-1" />
        Runs cannot be created by text or call because a phone number{' '}
        has not been allocated for this experience.{' '}
        <button
          disabled={systemActionRequestState === 'pending'}
          className="btn btn-sm btn-primary ml-2"
          onClick={() => assignTempRelayEntryway(org.id, experience.id)}>
          Assign temporary number
        </button>
      </div>
    );
  }
  if (relayEntryway.keyword) {
    return (
      <div>
        <i className="fa fa-phone mr-1" />
        Runs can be created for <b>{entrywayForRole.title}</b> by text starting with &quot;{relayEntryway.keyword}&quot;{' '}
        to <b>{entrywayWithRole.title}</b> at{' '}
        {formatPhoneNumberIntl(relayEntryway.relayService.phoneNumber)}.
      </div>
    );
  }
  const tempDisclaimer = relayEntryway.isTemporary ?
    ' This number is temporary and may be reclaimed without notice. Contact agency@firstperson.travel for a permanent number.' :
    '';
  return (
    <div>
      <i className="fa fa-phone mr-1" />
      Runs can be created for <b>{entrywayForRole.title}</b> by call or text to <b>{entrywayWithRole.title}</b> at{' '}
      {formatPhoneNumberIntl(relayEntryway.relayService.phoneNumber)}.
      {tempDisclaimer}
    </div>
  );
}

function renderEntrywayWebpage(org, experience, script) {
  const entrywayInterfaces = _.filter(script.content.interfaces, { entryway: true });
  if (!entrywayInterfaces.length) {
    return (
      <div>
        <i className="fa fa-file mr-1" />
        Runs cannot be created over the web because no entryway interfaces exist.
      </div>
    );
  }

  return entrywayInterfaces.map((i) => {
    const roles = _.filter(script.content.roles, { interface: i.name });
    return roles.map((role) => {
      const roleUrl =
        `${window.location.origin}/entry/${org.name}/` +
        `${experience.name}/${TextUtil.dashVarForText(role.title)}`;
      return (
        <div className="constrain-text" key={`${i.name}-${role.name}`}>
          <i className="fa fa-file mr-1" />
          Runs for <b>{role.title}</b> can be created at
          <a
            className="ml-1"
            href={roleUrl}
            target="_blank"
            rel="noopener noreferrer">
            {roleUrl}
          </a>
        </div>
      );
    });
  });
}

function renderEntrywayNote(
  org, experience, script, assignTempRelayEntryway, systemActionRequestState
) {
  if (!script.content) {
    return null;
  }
  const actorUrl = `${window.location.origin}/actor/${org.name}`;
  return (
    <div className="alert alert-secondary">
      {renderEntrywayRelay(
        org, experience, script, assignTempRelayEntryway, systemActionRequestState
      )}
      {renderEntrywayWebpage(org, experience, script)}
      <div>
        <i className="fa fa-theater-masks mr-1" />
        Performer URL: <a target="_blank" rel="noopener noreferrer" href={actorUrl}>{actorUrl}</a>
      </div>
    </div>
  );
}

class Schedule extends Component {
  constructor(props) {
    super(props);
    this.handleCreateTripToggle = this.handleCreateTripToggle.bind(this);
    this.handleCreateTrip = this.handleCreateTrip.bind(this);
    this.state = { redirectToNext: null };
  }

  componentDidUpdate(prevProps) {
    const oldMax = Math.max(...prevProps.trips.map(g => g.id));
    const newMax = Math.max(...this.props.trips.map(g => g.id));
    if (this.state.redirectToNext === oldMax && newMax > oldMax) {
      this.props.history.push(
        `/${this.props.org.name}/${this.props.experience.name}/schedule` +
        `/${this.props.match.params.year}/${this.props.match.params.month}` +
        `/${newMax}`);
    }
  }

  handleCreateTripToggle() {
    this.props.history.push(
      `/${this.props.org.name}/${this.props.experience.name}/schedule` +
      `/${this.props.match.params.year}/${this.props.match.params.month}`);
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

  initializeTrip(script, tripFields) {
    const roles = script.content.roles || [];
    this.props.createTrip(tripFields, roles.map(role => ({
      collection: 'players',
      fields: this.initialFieldsForRole(script.experience, script,
        role, tripFields.variantNames.split(',')),
      insertions: { tripId: 'id' }
    })));
    this.props.trackEvent('Created a run');
  }

  handleCreateTrip(script, fields) {
    const date = moment().format('YYYY-MM-DD');
    const initialFields = TripCore.getInitialFields(
      script.content, date,
      script.experience.timezone, fields.variantNames);
    const tripFields = Object.assign(initialFields, {
      orgId: script.orgId,
      experienceId: script.experienceId,
      scriptId: script.id,
      date: date,
      title: fields.title,
      variantNames: fields.variantNames.join(','),
      tripState: { currentSceneName: '' }
    });

    this.initializeTrip(script, tripFields);
    this.handleCreateTripToggle();

    const oldMax = Math.max(...this.props.trips.map(g => g.id));
    this.setState({ redirectToNext: oldMax });
  }

  renderMonth() {
    const now = moment.utc();
    const cur = moment(
      `${this.props.match.params.year}-${this.props.match.params.month}-01`,
      'YYYY-MM-DD');
    const oneMonthAgo = cur.clone().subtract(1, 'months');
    const inOneMonth = cur.clone().add(1, 'months');
    return (
      <div className="btn-group d-flex mb-3">
        <Link
          className="btn btn-outline-secondary"
          to={`/${this.props.org.name}/${this.props.experience.name}/schedule/${oneMonthAgo.format('YYYY/MM')}`}>
          &laquo;
        </Link>
        <Link
          className="btn btn-outline-secondary w-100"
          to={`/${this.props.org.name}/${this.props.experience.name}/schedule/${now.format('YYYY/MM')}`}>
          {cur.format('MMMM YYYY')}
        </Link>
        <Link
          className="btn btn-outline-secondary"
          to={`/${this.props.org.name}/${this.props.experience.name}/schedule/${inOneMonth.format('YYYY/MM')}`}>
          &raquo;
        </Link>
      </div>
    );
  }

  renderTripItem(trip) {
    const archivedStyle = { textDecoration: 'line-through' };
    const archivedIcon = <i className="fa fa-archive ml-1" />;
    const tripDate = moment.utc(trip.date).format('MMM D');
    const tripTitle = `${tripDate} ${trip.title}`;
    const tripText = tripTitle + (trip.isArchived ? ' (archived)' : '');
    return {
      key: trip.id,
      text: tripText,
      label: (
        <span style={trip.isArchived ? archivedStyle : null}>
          {tripTitle}{trip.isArchived ? archivedIcon : null}
        </span>
      ),
      url: (
        `/${this.props.org.name}/${this.props.experience.name}` +
        `/schedule/${moment(trip.date).format('YYYY/MM')}` +
        `/${trip.id}${this.props.location.search}`
      )
    };
  }

  renderGroups() {
    const now = moment.utc().format('YYYY-MM');
    const cur = `${this.props.match.params.year}-${this.props.match.params.month}`;
    const isCurrentOrFuture = cur >= now;
    const newTripItem = isCurrentOrFuture ? [{
      key: 'new',
      isExact: true,
      text: 'New run',
      label: 'New run',
      url: `/${this.props.org.name}/${this.props.experience.name}/schedule/${this.props.match.params.year}/${this.props.match.params.month}?trip=new`
    }] : [];

    const tripItems = this.props.trips
      .sort((a, b) => (a.isArchived < b.isArchived ? -1 : 1))
      .map(trip => this.renderTripItem(trip))
      .concat(newTripItem);

    if (!tripItems.length) {
      if (this.props.trips.isLoading) {
        return <Loader />;
      }
      return (
        <div className="alert alert-warning">
          No trips for {moment.utc(cur, 'YYYY-MM').format('MMM YYYY')}.
        </div>
      );
    }

    return (
      <ResponsiveListGroup items={tripItems} history={this.props.history} />
    );
  }

  render() {
    // console.log('this.props.script', this.props.script);
    // if (this.props.script.isLoading) {
    //   return <Loader />;
    // }
    if (!this.props.script.isLoading && !this.props.script.content) {
      return <div className="container-fluid">Error</div>;
    }
    if (this.props.trips.isError || this.props.script.isError) {
      return <div className="container-fluid">Error</div>;
    }
    const query = new URLSearchParams(this.props.location.search);
    const isCreateTripModalOpen = query.get('trip') === 'new';
    const isShowingArchived = query.get('archived') === 'true';
    const toggleArchivedLink = isShowingArchived ?
      <Link to={{ search: '' }}>Hide archived</Link> :
      <Link to={{ search: '?archived=true' }}>Show archived</Link>;
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-4">
            {this.renderMonth()}
            {this.renderGroups()}
            <div className="m-1 d-none d-sm-block">
              {toggleArchivedLink}
            </div>
          </div>
          <div className="col-sm-8">
            {renderEntrywayNote(this.props.org, this.props.experience, this.props.script,
              this.props.assignTempRelayEntryway, this.props.systemActionRequestState)}
            {this.props.children}
          </div>
        </div>
        <TripModal
          isOpen={isCreateTripModalOpen}
          script={this.props.script}
          onClose={this.handleCreateTripToggle}
          onConfirm={this.handleCreateTrip} />
      </div>
    );
  }
}

Schedule.propTypes = {
  match: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired,
  createTrip: PropTypes.func.isRequired,
  assignTempRelayEntryway: PropTypes.func.isRequired,
  systemActionRequestState: PropTypes.string,
  trackEvent: PropTypes.func.isRequired,
  participants: PropTypes.array.isRequired,
  profiles: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired
};

Schedule.defaultProps = {
  systemActionRequestState: null
};

const withExp = withLoader(Schedule, ['experience.id'], (props) => {
  // Non-archived trips, groups, and scripts are all queryed by the Project
  // container.
  props.listCollection('relayEntryways', {
    orgId: props.experience.orgId,
    experienceId: props.experience.id,
    stage: getStage()
  });
  props.listCollection('relayServices', {
    stage: getStage()
  });
});

export default withLoader(withExp, [
  'match.params.month',
  'match.params.year'
], (props) => {
  const thisMonth = moment(
    `${props.match.params.year}-${props.match.params.month}-01`,
    'YYYY-MM-DD');
  const nextMonth = thisMonth.clone().add(1, 'months');
  props.listCollection('trips', {
    date__gte: thisMonth.format('YYYY-MM-DD'),
    date__lt: nextMonth.format('YYYY-MM-DD'),
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
});
