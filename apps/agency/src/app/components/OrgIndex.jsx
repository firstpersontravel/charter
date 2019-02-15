import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ExperienceList from '../partials/ExperienceList';

const EXAMPLES = [{
  name: 'phonetree',
  title: 'Phone tree',
  desc: 'An interactive phone tree. The player dials a number and hears a question. They respond by voice to direct the conversation.',
  demo: 'Demonstrates relays, clips, and queries.'
}, {
  name: 'roadtrip',
  title: 'Road trip',
  desc: 'A road trip across California with multiple stops and driving directions.',
  demo: 'Demonstrates routes, geofences, directions, waypoints and pages.'
}, {
  name: 'textconvo',
  title: 'Text convo',
  desc: 'An interactive conversation via texting. An automated role responds to player texts.',
  demo: 'Demonstrates relays, conditional actions, if statements, and messages.'
}, {
  name: 'walkingtour',
  title: 'Walking tour',
  desc: 'A walking tour through two restaurants, with dish selections at each stop.',
  demo: 'Demonstrates messages, images, geofences, and directions.'
}];

export default class OrgIndex extends Component {
  constructor(props) {
    super(props);
    this.state = { creatingExample: null };
  }

  handleCreateExample(example) {
    if (this.state.creatingExample) {
      return;
    }
    this.setState({ creatingExample: example.name });
    fetch(`/content/examples/${example.name}`)
      .then(r => r.json())
      .then((data) => {
        this.props.createExample(this.props.org.id, example, data);
        this.setState({ creatingExample: null });
      })
      .catch((err) => {
        console.error(`Error creating example: ${err.message}.`);
        this.setState({ creatingExample: null });
      });
    // this.props.createInstance('experiences', {
    //   orgId: this.props.org.id
    // });
  }

  renderExamples() {
    const renderedExamples = EXAMPLES.map(example => (
      <div key={example.name} className="card">
        <h5 className="card-header">{example.title}</h5>
        <div className="card-body">
          <p className="card-text">{example.desc}</p>
          <p className="card-text">{example.demo}</p>
        </div>
        <div className="card-footer">
          <button
            disabled={!!this.state.creatingExample}
            onClick={() => this.handleCreateExample(example)}
            className="btn btn-block btn-primary">
            {this.state.creatingExample === example.name ? 'Creating' : 'Create'} {example.title.toLowerCase()}
          </button>
        </div>
      </div>
    ));
    return (
      <div className="card-group">
        {renderedExamples}
      </div>
    );
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-3">
            <ExperienceList
              location={this.props.location}
              org={this.props.org}
              experiences={this.props.experiences}
              createInstance={this.props.createInstance} />
          </div>
          <div className="col-sm-9">
            <h1>Welcome to the Multiverse!</h1>
            <p>
              This toolkit will help you create the immersive experience of
              your dreams. To get started, you can try out one of the below
              examples.
            </p>
            {this.renderExamples()}
          </div>
        </div>
      </div>
    );
  }
}

OrgIndex.propTypes = {
  location: PropTypes.object.isRequired,
  org: PropTypes.object.isRequired,
  experiences: PropTypes.array.isRequired,
  createExample: PropTypes.func.isRequired,
  createInstance: PropTypes.func.isRequired
};
