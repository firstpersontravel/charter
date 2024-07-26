import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatPhoneNumberIntl } from 'react-phone-number-input';

import { TextUtil } from 'fptcore';

import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';
import GroupModal from '../partials/GroupModal';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';
import { getStage } from '../../utils';

function renderEntrywayRelay(org, experience, scripts, updateRelays, systemActionRequestState) {
  const activeScript = _.find(scripts, { isActive: true });
  const entrywaySpec = _.find(_.get(activeScript, 'content.relays'), { entryway: true });
  const entrywayForRole = _.find(_.get(activeScript, 'content.roles'), { name: entrywaySpec.for });
  const entrywayWithRole = _.find(_.get(activeScript, 'content.roles'), { name: entrywaySpec.with });
  if (!entrywaySpec) {
    return (
      <div>
        <i className="fa fa-phone mr-1" />
        Runs cannot be created by text or call because no entryway phone line exists.
      </div>
    );
  }
  const relayEntryway = _.find(experience.relayEntryways, {});
  if (!relayEntryway) {
    return (
      <div>
        <i className="fa fa-phone mr-1" />
        Runs cannot be created by text or call because a phone number{' '}
        has not been allocated for this experience.{' '}
        Contact agency@firstperson.travel for help setting this up.
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
  return (
    <div>
      <i className="fa fa-phone mr-1" />
      Runs can be created for <b>{entrywayForRole.title}</b> by call or text to <b>{entrywayWithRole.title}</b> at{' '}
      {formatPhoneNumberIntl(relayEntryway.relayService.phoneNumber)}.
    </div>
  );
}

function renderEntrywayWebpage(org, experience, scripts) {
  const activeScript = _.find(scripts, { isActive: true });
  const entrywayInterfaces = _.filter(activeScript.content.interfaces, { entryway: true });
  if (!entrywayInterfaces.length) {
    return (
      <div>
        <i className="fa fa-file mr-1" />
        Runs cannot be created over the web because no entryway interfaces exist.
      </div>
    );
  }

  return entrywayInterfaces.map((i) => {
    const roles = _.filter(activeScript.content.roles, { interface: i.name });
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

function renderEntrywayNote(org, experience, scripts, updateRelays, systemActionRequestState) {
  const activeScript = _.find(scripts, { isActive: true });
  if (!activeScript) {
    return null;
  }
  const actorUrl = `${window.location.origin}/actor/${org.name}`;
  return (
    <div className="alert alert-secondary">
      {renderEntrywayRelay(org, experience, scripts, updateRelays, systemActionRequestState)}
      {renderEntrywayWebpage(org, experience, scripts)}
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
    this.handleCreateGroupToggle = this.handleCreateGroupToggle.bind(this);
    this.handleCreateGroup = this.handleCreateGroup.bind(this);
    this.state = { redirectToNext: null };
  }

  componentDidUpdate(prevProps) {
    const oldMax = Math.max(...prevProps.groups.map(g => g.id));
    const newMax = Math.max(...this.props.groups.map(g => g.id));
    if (this.state.redirectToNext === oldMax && newMax > oldMax) {
      this.props.history.push(
        `/${this.props.org.name}/${this.props.experience.name}/schedule` +
        `/${this.props.match.params.year}/${this.props.match.params.month}` +
        `/${newMax}`);
    }
  }

  handleCreateGroupToggle() {
    this.props.history.push(
      `/${this.props.org.name}/${this.props.experience.name}/schedule` +
      `/${this.props.match.params.year}/${this.props.match.params.month}`);
  }

  handleCreateGroup(fields) {
    this.props.createInstance('groups', {
      date: fields.date,
      orgId: this.props.org.id,
      experienceId: this.props.experience.id,
      scriptId: fields.scriptId
    });
    this.props.trackEvent('Created a run group');
    this.handleCreateGroupToggle();
    const oldMax = Math.max(...this.props.groups.map(g => g.id));
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

  renderGroupItem(group) {
    const archivedStyle = { textDecoration: 'line-through' };
    const archivedIcon = <i className="fa fa-archive ml-1" />;
    const groupDate = moment.utc(group.date).format('MMM D');
    const tripTitles = group.trips.length ?
      ` ∙ ${group.trips.map(trip => trip.title).join(', ')}` :
      '';
    const groupTitle = `${groupDate}${tripTitles}`;
    const groupText = groupTitle + (group.isArchived ? ' (archived)' : '');
    return {
      key: group.id,
      text: groupText,
      label: (
        <span style={group.isArchived ? archivedStyle : null}>
          {groupTitle}{group.isArchived ? archivedIcon : null}
        </span>
      ),
      url: (
        `/${this.props.org.name}/${this.props.experience.name}` +
        `/schedule/${moment(group.date).format('YYYY/MM')}` +
        `/${group.id}${this.props.location.search}`
      )
    };
  }

  renderGroups() {
    const now = moment.utc().format('YYYY-MM');
    const cur = `${this.props.match.params.year}-${this.props.match.params.month}`;
    const isCurrentOrFuture = cur >= now;
    const newGroupItem = isCurrentOrFuture ? [{
      key: 'new',
      isExact: true,
      text: 'New run group',
      label: 'New run group',
      url: `/${this.props.org.name}/${this.props.experience.name}/schedule/${this.props.match.params.year}/${this.props.match.params.month}?group=new`
    }] : [];

    const groupItems = this.props.groups
      .sort((a, b) => (a.isArchived < b.isArchived ? -1 : 1))
      .map(group => this.renderGroupItem(group))
      .concat(newGroupItem);

    if (!groupItems.length) {
      if (this.props.groups.isLoading) {
        return <Loader />;
      }
      return (
        <div className="alert alert-warning">
          No runs for {moment.utc(cur, 'YYYY-MM').format('MMM YYYY')}.
        </div>
      );
    }

    return (
      <ResponsiveListGroup items={groupItems} history={this.props.history} />
    );
  }

  render() {
    if (this.props.groups.isError) {
      return <div className="container-fluid">Error</div>;
    }
    const query = new URLSearchParams(this.props.location.search);
    const isCreateGroupModalOpen = query.get('group') === 'new';
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
            {renderEntrywayNote(this.props.org, this.props.experience, this.props.scripts,
              this.props.updateRelays, this.props.systemActionRequestState)}
            {this.props.children}
          </div>
        </div>
        <GroupModal
          isOpen={isCreateGroupModalOpen}
          scripts={this.props.scripts}
          onClose={this.handleCreateGroupToggle}
          onConfirm={this.handleCreateGroup} />
      </div>
    );
  }
}

Schedule.propTypes = {
  match: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired,
  scripts: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  trackEvent: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired,
  systemActionRequestState: PropTypes.string,
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
  props.listCollection('groups', {
    date__gte: thisMonth.format('YYYY-MM-DD'),
    date__lt: nextMonth.format('YYYY-MM-DD'),
    experienceId: props.experience.id,
    orgId: props.experience.orgId
  });
});
