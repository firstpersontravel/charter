import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import ExperienceModal from '../partials/ExperienceModal';

export default class ExperienceList extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.handleCreateExperience = this.handleCreateExperience.bind(this);
    this.handleExperienceModalClose = this.handleExperienceModalClose
      .bind(this);
  }

  handleExperienceModalClose() {
    browserHistory.push(`/${this.props.org.name}`);
  }

  handleCreateExperience(fields) {
    const createFields = Object.assign({
      orgId: this.props.org.id
    }, fields);
    this.props.createInstance('experiences', createFields);
    browserHistory.push(`/${this.props.org.name}/${fields.name}`);
  }

  render() {
    const experiences = this.props.experiences;
    if (experiences.isError) {
      return (
        <div className="container-fluid">Error loading experiences.</div>
      );
    }
    const renderedExperiences = experiences
      .filter(experience => !experience.isArchived)
      .map(experience => (
        <Link
          key={experience.id}
          className="list-group-item list-group-item-action"
          activeClassName="active"
          to={`/${experience.org.name}/${experience.name}`}>
          {experience.title}
        </Link>
      ));

    const isCreatingExperience = !!this.props.location.query.creating;

    return (
      <div>
        <div className="list-group">
          {renderedExperiences}
          <Link
            className="list-group-item list-group-item-action"
            activeClassName="active"
            to={`/${this.props.org.name}?creating=true`}>
            <i className="fa fa-plus" />&nbsp;
            New experience
          </Link>
        </div>
        <ExperienceModal
          isOpen={isCreatingExperience}
          onClose={this.handleExperienceModalClose}
          onConfirm={this.handleCreateExperience} />
      </div>
    );
  }
}

ExperienceList.propTypes = {
  location: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired
};
