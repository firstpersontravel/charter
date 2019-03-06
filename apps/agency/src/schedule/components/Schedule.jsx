import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import { withLoader } from '../../loader-utils';
import GroupModal from '../partials/GroupModal';
import ResponsiveNav from '../../partials/ResponsiveNav';
import { getStage } from '../../utils';

class Schedule extends Component {

  constructor(props) {
    super(props);
    this.handleCreateGroupToggle = this.handleCreateGroupToggle.bind(this);
    this.handleCreateGroup = this.handleCreateGroup.bind(this);
  }

  handleCreateGroupToggle() {
    browserHistory.push(`/${this.props.org.name}/${this.props.experience.name}/schedule`);
  }

  handleCreateGroup(fields) {
    this.props.createInstance('groups', {
      date: fields.date,
      orgId: this.props.org.id,
      experienceId: this.props.experience.id,
      scriptId: fields.scriptId
    });
    this.handleCreateGroupToggle();
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

  renderMonth() {
    const now = moment.utc();
    const cur = moment(
      `${this.props.params.year}-${this.props.params.month}-01`,
      'YYYY-MM-DD');
    const oneMonthAgo = cur.clone().subtract(1, 'months');
    const inOneMonth = cur.clone().add(1, 'months');
    return (
      <div style={{ marginBottom: '1em' }} className="btn-group d-flex">
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

  renderGroups() {
    const now = moment.utc().format('YYYY-MM');
    const cur = `${this.props.params.year}-${this.props.params.month}`;
    const isCurrentOrFuture = cur >= now;
    const newGroupItem = isCurrentOrFuture ? [{
      key: 'new',
      text: 'New group',
      label: 'New group',
      url: `/${this.props.org.name}/${this.props.experience.name}/schedule?group=new`
    }] : [];

    const groupItems = this.props.groups.map(group => ({
      key: group.id,
      text: moment.utc(group.date).format('MMM D, YYYY'),
      label: (
        <span>
          {moment.utc(group.date).format('MMM D, YYYY')}
          {group.isArchived ? (
            <i style={{ marginLeft: '0.25em' }} className="fa fa-archive" />
          ) : null}
        </span>
      ),
      url: (
        `/${this.props.org.name}/${this.props.experience.name}` +
        `/schedule/${moment(group.date).format('YYYY/MM')}/${group.id}`
      )
    })).concat(newGroupItem);

    if (!groupItems.length) {
      if (this.props.groups.isLoading) {
        return 'Loading...';
      }
      return (
        <div className="alert alert-warning">
          No trips for {moment.utc(cur, 'YYYY-MM').format('MMM YYYY')}.
        </div>
      );
    }

    return (
      <ResponsiveNav items={groupItems} />
    );
  }

  render() {
    const isCreateGroupModalOpen = this.props.location.query.group === 'new';
    if (this.props.groups.isError) {
      return <div className="container-fluid">Error</div>;
    }
    return (
      <div className="container-fluid">
        {this.renderTrailhead()}
        <div className="row">
          <div className="col-sm-4">
            {this.renderMonth()}
            {this.renderGroups()}
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
  params: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  groups: PropTypes.array.isRequired,
  scripts: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired,
  systemActionRequestState: PropTypes.string,
  children: PropTypes.node.isRequired
};

Schedule.defaultProps = {
  systemActionRequestState: null
};

const withExp = withLoader(Schedule, ['experience.id'], (props) => {
  // Non-archived trips, groups, and scripts are all queryed by the Experience
  // container.
  props.listCollection('relays', {
    orgId: props.experience.orgId,
    experienceId: props.experience.id,
    stage: getStage(),
    userPhoneNumber: ''
  });
});

export default withLoader(withExp, [
  'params.month',
  'params.year'
], (props) => {
  const thisMonth = moment(
    `${props.params.year}-${props.params.month}-01`,
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
