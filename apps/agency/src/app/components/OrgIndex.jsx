import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import Examples from '../examples';
import ExperienceModal from '../partials/ExperienceModal';

export default class OrgIndex extends Component {
  constructor(props) {
    super(props);
    this.handleCreateExperience = this.handleCreateExperience.bind(this);
    this.handleExperienceModalClose = this.handleExperienceModalClose
      .bind(this);
  }

  getCreatingExample() {
    const creatingExampleName = this.props.location.query.creating;
    const creatingExample = _.find(Examples, { name: creatingExampleName });
    return creatingExample;
  }

  handleExperienceModalClose() {
    browserHistory.push(`/${this.props.org.name}`);
  }

  handleCreateExperience(fields) {
    const example = this.getCreatingExample();
    fetch(`/content/examples/${example.name}`)
      .then((r) => {
        if (r.status !== 200) {
          throw new Error(`Status was ${r.status}`);
        }
        return r
          .json()
          .then((data) => {
            this.props.createExample(this.props.org.id, fields, example, data);
            browserHistory.push(`/${this.props.org.name}/${fields.name}`);
          });
      })
      .catch((err) => {
        console.error(`Error creating example: ${err.message}.`);
      });
  }

  renderExample(example) {
    return (
      <div key={example.name} className="card" style={{ marginBottom: '1em' }} >
        <h5 className="card-header d-none d-sm-block">{example.title}</h5>
        <div className="card-body d-none d-sm-block">
          <p className="card-text">{example.desc}</p>
          <p className="card-text">{example.demo}</p>
        </div>
        <div className="card-footer">
          <Link
            className="btn btn-block btn-secondary"
            to={`/${this.props.org.name}?creating=${example.name}`}>
            <i className="fa fa-plus" />&nbsp;
            Create {example.title.toLowerCase()}
          </Link>
        </div>
      </div>
    );
  }

  renderExperience(experience) {
    return (
      <div key={experience.id} className="card" style={{ marginBottom: '1em' }} >
        <h5 className="card-header d-none d-sm-block">{experience.title}</h5>
        <div className="card-body d-none d-sm-block">
          <p className="card-text">
            <Link
              to={`/${this.props.org.name}/${experience.name}/script`}>
              Edit script
            </Link>
          </p>
          <p className="card-text">
            <Link
              to={`/${this.props.org.name}/${experience.name}/operate`}>
              Schedule and operate
            </Link>
          </p>
          <p className="card-text">
            <Link
              to={`/${this.props.org.name}/${experience.name}/directory`}>
              Browse users
            </Link>
          </p>
        </div>
        <div className="card-footer">
          <Link
            to={`/${this.props.org.name}/${experience.name}`}
            className="btn btn-block btn-primary">
            Go to {experience.title}
          </Link>
        </div>
      </div>
    );
  }

  renderExamples() {
    const renderedExperiences = this.props.experiences.map(experience => (
      this.renderExperience(experience)
    ));
    const renderedExamples = Examples.map(example => (
      this.renderExample(example)
    ));
    const items = [].concat(renderedExperiences).concat(renderedExamples);
    return (
      <div className="card-deck">
        {items}
      </div>
    );
  }

  render() {
    const creatingExample = this.getCreatingExample();
    return (
      <div className="container-fluid">
        <h1>Welcome to the Multiverse!</h1>
        <p>
          This toolkit will help you create the immersive experience of
          your dreams. To get started, you can try out one of the below
          examples.
        </p>
        {this.renderExamples()}

        <ExperienceModal
          isOpen={!!creatingExample}
          example={creatingExample}
          onClose={this.handleExperienceModalClose}
          onConfirm={this.handleCreateExperience} />
      </div>
    );
  }
}

OrgIndex.propTypes = {
  location: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createExample: PropTypes.func.isRequired
};
