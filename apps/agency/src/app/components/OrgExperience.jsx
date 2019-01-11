import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import ExperienceList from '../partials/ExperienceList';
import ExperienceModal from '../partials/ExperienceModal';
import { getStage } from '../../utils';

export default class OrgExperience extends Component {
  constructor(props) {
    super(props);
    this.handleArchiveExperience = this.handleArchiveExperience.bind(this);
    this.handleUpdateExperience = this.handleUpdateExperience.bind(this);
    this.handleCreateScript = this.handleCreateScript.bind(this);
  }

  componentDidMount() {
    this.loadRelays(this.props.experience);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.experience.id !== this.props.experience.id) {
      this.loadRelays(nextProps.experience);
    }
  }

  handleUpdateExperience(fields) {
    this.props.updateInstance('experiences', this.props.experience.id, fields);
    browserHistory.push(`${this.props.experience.org.name}/${fields.name}`);
  }

  handleArchiveExperience() {
    this.props.updateInstance('experiences', this.props.experience.id, {
      isArchived: !this.props.experience.isArchived
    });
  }

  handleCreateScript() {
    this.props.createInstance('scripts', {
      orgId: this.props.experience.orgId,
      experienceId: this.props.experience.id,
      revision: 1,
      contentVersion: 1
    });
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
    const activeRevision = _(experience.scripts)
      .filter('isActive')
      .map('revision')
      .head();
    const renderedScripts = experience.scripts.map((script) => {
      const scriptStatus = script.isActive ? 'Active' : 'Draft';
      const hasBadge = script.isActive || script.revision > activeRevision;
      const badgeClass = `badge ${script.isActive ? 'badge-primary' : 'badge-secondary'}`;
      const badge = hasBadge ? (
        <span
          style={{ marginLeft: '0.25em' }}
          className={badgeClass}>
          {scriptStatus}
        </span>
      ) : null;
      return (
        <div key={script.id}>
          <Link to={`/${org.name}/${experience.name}/design/script/${script.revision}`}>
            Revision {script.revision}
            {badge}
          </Link>
        </div>
      );
    });

    const renderedGroups = experience.groups.map(group => (
      <div key={group.id}>
        <Link to={`/${org.name}/${experience.name}/operate/${group.id}/all`}>
          {moment(group.date).format('MMM D, YYYY')}
        </Link>
      </div>
    ));

    const hasNoScripts = !experience.scripts.length &&
      !experience.scripts.isLoading;
    const newScriptBtn = hasNoScripts ? (
      <button
        onClick={this.handleCreateScript}
        className="btn btn-primary">
        Create new script
      </button>
    ) : null;

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

    const isEditingExperience = !!this.props.location.query.editing;

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-3">
            <ExperienceList
              location={this.props.location}
              org={this.props.experience.org}
              experiences={this.props.experiences}
              createInstance={this.props.createInstance} />
          </div>
          <div className="col-sm-9">
            <div style={{ float: 'right' }}>
              <Link
                className="btn btn-outline-secondary"
                to={`/${org.name}/${experience.name}?editing=true`}>
                Edit
              </Link>
              &nbsp;
              <button
                onClick={() => this.handleArchiveExperience(experience.id)}
                className="btn btn-outline-secondary">
                {experience.isArchived ? 'Unarchive' : 'Archive'}
              </button>
            </div>

            <h1>{experience.title}</h1>

            <div className="row">
              <div className="col-md-3">
                <h3>Design</h3>
                {renderedScripts}
                {newScriptBtn}
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
        </div>
        <ExperienceModal
          isOpen={isEditingExperience}
          experience={this.props.experience}
          onClose={() => browserHistory.push(window.location.pathname)}
          onConfirm={this.handleUpdateExperience} />
      </div>
    );
  }
}

OrgExperience.propTypes = {
  systemActionRequestState: PropTypes.string,
  location: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  listCollection: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired,
  updateRelays: PropTypes.func.isRequired
};

OrgExperience.defaultProps = {
  systemActionRequestState: null
};
