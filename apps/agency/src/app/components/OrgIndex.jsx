import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import Examples from '../examples';
import ExperienceModal from '../partials/ExperienceModal';

const cardBodyStyles = {
  flex: '1 1 auto'
};

export default class OrgIndex extends Component {
  constructor(props) {
    super(props);
    this.handleCreateExperience = this.handleCreateExperience.bind(this);
    this.handleExperienceModalClose = this.handleExperienceModalClose
      .bind(this);
  }

  getCreatingExample() {
    const query = new URLSearchParams(this.props.location.search);
    const creatingExampleName = query.get('creating');
    const creatingExample = _.find(Examples, { name: creatingExampleName });
    return creatingExample;
  }

  handleExperienceModalClose() {
    this.props.history.push(`/${this.props.org.name}`);
  }

  handleCreateExperience(example, fields) {
    fetch(`/content/examples/${example.name}`)
      .then((r) => {
        if (r.status !== 200) {
          throw new Error(`Status was ${r.status}`);
        }
        return r
          .json()
          .then((data) => {
            this.props.trackEvent('Created a project',
              { example: example.title });
            this.createExperienceFromExample(fields, data.content,
              data.assets || []);
            this.props.history.push(`/${this.props.org.name}/${fields.name}`);
          })
          .catch((err) => {
            // Errors outside synchronous function aren't captured by
            // react.
            console.error(`Error creating example: ${err.message}`);
            Sentry.captureException(err);
          });
      })
      .catch((err) => {
        // Errors outside synchronous function aren't captured by
        // react.
        console.error(`Error fetching example: ${err.message}.`);
        Sentry.captureException(err);
      });
  }

  createExperienceFromExample(fields, scriptContent, assetsContent) {
    const expFields = Object.assign({
      orgId: this.props.org.id
    }, fields);
    // Create example, then create script
    const scriptInsertion = {
      collection: 'scripts',
      fields: {
        orgId: this.props.org.id,
        revision: 1,
        content: scriptContent,
        isActive: true
      },
      insertions: {
        experienceId: 'id'
      }
    };
    const assetInsertions = assetsContent.map((assetContent, i) => ({
      collection: 'assets',
      fields: {
        orgId: this.props.org.id,
        data: assetContent.data,
        type: assetContent.type,
        name: `asset-${i}`
      },
      insertions: {
        experienceId: 'id'
      }
    }));
    const insertions = [scriptInsertion].concat(assetInsertions);
    this.props.createInstances('experiences', expFields, insertions);
  }

  renderExample(example) {
    return (
      <div className="col mb-3" key={example.name}>
        <div className="card card-project">
          <h5 className="card-header d-none d-sm-block">{example.title}</h5>
          <div className="card-body d-none d-sm-block" style={cardBodyStyles}>
            <p className="card-text">{example.desc}</p>
            <p className="card-text">{example.demo}</p>
          </div>
          <div className="card-footer d-grid gap-2">
            <Link
              className="btn btn-secondary"
              to={`/${this.props.org.name}?creating=${example.name}`}>
              <i className="fa fa-plus" />
  &nbsp;
              Create&nbsp;
              {example.title.toLowerCase()}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  renderExperience(experience) {
    return (
      <div className="col mb-3" key={experience.id}>
        <div className="card card-project">
          <h5 className="card-header d-none d-sm-block">{experience.title}</h5>
          <div className="card-body d-none d-sm-block" style={cardBodyStyles}>
            <p className="card-text">
              <Link
                to={`/${this.props.org.name}/${experience.name}/script`}>
                Edit project
              </Link>
            </p>
            <p className="card-text">
              <Link
                to={`/${this.props.org.name}/${experience.name}/schedule`}>
                Schedule
              </Link>
            </p>
            <p className="card-text">
              <Link
                to={`/${this.props.org.name}/${experience.name}/directory`}>
                Browse users
              </Link>
            </p>
          </div>
          <div className="card-footer d-grid gap-2">
            <Link
              to={`/${this.props.org.name}/${experience.name}`}
              className="btn btn-primary">
              Go to
              {' '}
              {experience.title}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  renderExamples() {
    const renderedExperiences = this.props.experiences.map(
      experience => this.renderExperience(experience)
    );
    const renderedExamples = Examples.map(
      example => this.renderExample(example)
    );
    const items = [].concat(renderedExperiences).concat(renderedExamples);
    return (
      <div className="row row-cols-1 row-cols-md-3">
        {items}
      </div>
    );
  }

  render() {
    const example = this.getCreatingExample();
    return (
      <div className="container-fluid">
        <h1>Home</h1>
        <p>
          To get started, you can try out one of the below examples.
        </p>
        {this.renderExamples()}

        <ExperienceModal
          isOpen={!!example}
          example={example}
          existingExperiences={this.props.experiences}
          onClose={this.handleExperienceModalClose}
          onConfirm={this.handleCreateExperience} />
      </div>
    );
  }
}

OrgIndex.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createInstances: PropTypes.func.isRequired,
  trackEvent: PropTypes.func.isRequired
};
