import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Loader from '../../partials/Loader';
import { withLoader } from '../../loader-utils';
import GroupModal from '../partials/GroupModal';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';
import { getStage } from '../../utils';

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
  children: PropTypes.node.isRequired
};

Schedule.defaultProps = {
  systemActionRequestState: null
};

const withExp = withLoader(Schedule, ['experience.id'], (props) => {
  // Non-archived trips, groups, and scripts are all queryed by the Project
  // container.
  props.listCollection('relays', {
    orgId: props.experience.orgId,
    experienceId: props.experience.id,
    stage: getStage(),
    participantPhoneNumber: ''
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
