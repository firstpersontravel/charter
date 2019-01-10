import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import ExperienceModal from '../partials/ExperienceModal';

export default class OrgIndex extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleUpdateExperience = this.handleUpdateExperience.bind(this);
    this.handleExperienceModalClose = this.handleExperienceModalClose
      .bind(this);
  }

  handleArchiveExperience(experienceId) {
    const experience = _.find(this.props.experiences, { id: experienceId });
    this.props.updateInstance('experiences', experienceId, {
      isArchived: !experience.isArchived
    });
  }

  handleExperienceModalClose() {
    browserHistory.push(`/${this.props.params.orgName}`);
  }

  handleUpdateExperience(fields) {
    const editingExperienceId = this.props.location.query.editing_experience;
    if (editingExperienceId === 'new') {
      this.props.createInstance('experiences', Object.assign({
        orgId: this.props.org.id
      }, fields));
    } else {
      this.props.updateInstance('experiences', editingExperienceId, fields);
    }
    this.handleExperienceModalClose();
  }

  render() {
    const experiences = this.props.experiences;
    if (experiences.isLoading) {
      return (
        <div className="container-fluid">Loading</div>
      );
    }
    if (experiences.isError) {
      return (
        <div className="container-fluid">Error</div>
      );
    }
    const renderedExperiences = experiences.map(experience => (
      <div key={experience.id}>
        <Link to={`/${experience.org.name}/${experience.name}`}>
          {experience.title}
        </Link>
        &nbsp;&bull;&nbsp;
        <Link
          className="btn btn-sm btn-outline-secondary"
          to={`/${this.props.org.name}?editing_experience=${experience.id}`}>
          Edit
        </Link>
        &nbsp;&bull;&nbsp;
        <button
          onClick={() => this.handleArchiveExperience(experience.id)}
          className="btn btn-sm btn-outline-secondary">
          {experience.isArchived ? 'Unarchive' : 'Archive'}
        </button>
      </div>
    ));

    const editingExperienceId = this.props.location.query.editing_experience;
    const editingExperience = editingExperienceId ?
      _.find(experiences, { id: Number(editingExperienceId) }) : null;

    return (
      <div className="container-fluid">
        {renderedExperiences}
        <div>
          <Link to={`/${this.props.org.name}?editing_experience=new`}>
            New experience
          </Link>
        </div>
        <ExperienceModal
          isOpen={!!editingExperienceId}
          experience={editingExperience}
          onClose={this.handleExperienceModalClose}
          onConfirm={this.handleUpdateExperience} />
      </div>
    );
  }
}

OrgIndex.propTypes = {
  location: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
