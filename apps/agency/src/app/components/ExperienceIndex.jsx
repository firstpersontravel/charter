import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

import { getStage } from '../../utils';

export default class ExperienceIndex extends Component {
  componentDidMount() {
    this.loadRelays(this.props.experience);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.experience.id !== this.props.experience.id) {
      this.loadRelays(nextProps.experience);
    }
  }

  loadRelays(experience) {
    this.props.listCollection('relays', {
      orgId: experience.orgId,
      experienceId: experience.id,
      stage: getStage(),
      userPhoneNumber: ''
    });
  }

  render() {
    const experience = this.props.experience;
    const org = experience.org;
    const renderedScripts = experience.scripts.map(script => (
      <div key={script.id}>
        <Link to={`/${org.name}/${experience.name}/design/script/${script.id}`}>
          Revision {script.revision}
        </Link>
      </div>
    ));

    const renderedGroups = experience.groups.map(group => (
      <div key={group.id}>
        <Link to={`/${org.name}/${experience.name}/operate/${group.id}/all`}>
          {moment(group.date).format('MMM D, YYYY')}
        </Link>
      </div>
    ));

    const activeScript = _.find(experience.scripts, { isActive: true });
    const trailheadSpecs = _.filter(_.get(activeScript, 'content.relays'), {
      trailhead: true
    });
    let hasUnallocated = false;
    const renderedTrailheads = trailheadSpecs.map((trailhead) => {
      const relay = _.find(experience.relays, {
        forRoleName: trailhead.for,
        asRoleName: trailhead.as,
        withRoleName: trailhead.with,
        userPhoneNumber: ''
      });
      if (!relay) {
        hasUnallocated = true;
      }
      return (
        <div key={trailhead.name}>
          {trailhead.for} with {trailhead.with}:<br />
          {relay ?
            TextUtil.formatPhone(relay.relayPhoneNumber) :
            'No number allocated.'}
        </div>
      );
    });

    const allocateRelaysBtn = hasUnallocated ? (
      <div style={{ marginTop: '1em' }}>
        <button
          disabled={this.props.systemActionRequestState === 'pending'}
          className="btn btn-outline-primary"
          onClick={() => this.props.updateRelays(org.id, experience.id)}>
          Allocate phone numbers
        </button>
      </div>
    ) : null;

    return (
      <div className="container-fluid">
        <h1>{experience.title}</h1>
        <div className="row">
          <div className="col-md-3">
            <h3>Design</h3>
            {renderedScripts}
          </div>
          <div className="col-md-3">
            <h3>Schedule</h3>
            <div>
              <Link to={`/${experience.org.name}/${experience.name}/schedule`}>
                Schedule new trips
              </Link>
            </div>
          </div>
          <div className="col-md-3">
            <h3>Operate</h3>
            {renderedGroups}
          </div>
          <div className="col-md-3">
            <h3>Trailheads</h3>
            {renderedTrailheads}
            {allocateRelaysBtn}
          </div>
        </div>
      </div>
    );
  }
}

ExperienceIndex.propTypes = {
  systemActionRequestState: PropTypes.string,
  experience: PropTypes.object.isRequired,
  listCollection: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired
};

ExperienceIndex.defaultProps = {
  systemActionRequestState: null
};
