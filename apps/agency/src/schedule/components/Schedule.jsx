import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import { withLoader } from '../../loader-utils';
import GroupModal from '../partials/GroupModal';
import ResponsiveListGroup from '../../partials/ResponsiveListGroup';
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

  renderGroups() {
    const groupItems = this.props.groups.map(group => ({
      key: group.id,
      text: moment.utc(group.date).format('MMM D, YYYY'),
      label: moment.utc(group.date).format('MMM D, YYYY'),
      url: `/${this.props.org.name}/${this.props.experience.name}/schedule/${group.id}`
    })).concat([{
      key: 'new',
      text: 'New group',
      label: 'New group',
      url: `/${this.props.org.name}/${this.props.experience.name}/schedule?group=new`
    }]);
    return (
      <ResponsiveListGroup items={groupItems} />
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

export default withLoader(Schedule, ['experience.id'], (props) => {
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
