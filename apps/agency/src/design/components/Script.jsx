import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextUtil } from 'fptcore';

import { getItems, doesCollectionHaveScene } from './utils';

export default class Script extends Component {

  getCurrentSceneName() {
    const params = this.props.params;
    let currentSceneName = this.props.location.query.scene || '';
    if (!currentSceneName && params.collectionName && params.resourceName) {
      const items = getItems(this.props.script, params.collectionName);
      const resource = _.find(items, { name: params.resourceName });
      if (resource) {
        currentSceneName = resource.scene;
      }
    }
    return currentSceneName;
  }

  handleSelectScene(sceneName) {
    const orgName = this.props.params.orgName;
    browserHistory.push(
      `/${orgName}/design/script/${this.props.script.id}` +
      `${sceneName ? `?scene=${sceneName}` : ''}`
    );
  }

  renderCollection(collectionName) {
    const orgName = this.props.params.orgName;
    const script = this.props.script;
    const currentCollectionName = this.props.params.collectionName || '';
    const currentSceneName = this.getCurrentSceneName();
    let items = getItems(script, collectionName);
    if (doesCollectionHaveScene(collectionName)) {
      items = items.filter(item => item.scene === currentSceneName);
    }

    const numItems = items.length;
    if (numItems === 0) {
      return (
        <div key={collectionName}>
          {TextUtil.titleForKey(collectionName)}
        </div>
      );
    }
    return (
      <div key={collectionName}>
        <Link
          // Since link activeClassName doesn't work automatically cos the
          // query param messes it up.
          className={currentCollectionName === collectionName ? 'bold' : ''}
          activeClassName="bold"
          to={{
            pathname: (
              `/${orgName}/design/script/${script.id}/collection/${collectionName}`
            ),
            query: currentSceneName ? { scene: currentSceneName } : null
          }}>
          {TextUtil.titleForKey(collectionName)} ({numItems})
        </Link>
      </div>
    );
  }

  renderSceneSelector() {
    const scenes = this.props.script.content.scenes || [];
    const currentSceneName = this.getCurrentSceneName();
    const sceneOptions = scenes.map(scene => (
      <option key={scene.name} value={scene.name}>
        {scene.title}
      </option>
    ));
    return (
      <div className="row">
        <div className="col-12">
          <select
            className="form-control"
            onChange={e => this.handleSelectScene(e.target.value)}
            value={currentSceneName}>
            <option value="">--</option>
            {sceneOptions}
          </select>
        </div>
      </div>
    );
  }

  renderCollections() {
    // Don't show directions
    return (
      <div>
        <div style={{ marginBottom: '0.5em' }}>
          <h4>Core</h4>
          {this.renderCollection('roles')}
          {this.renderCollection('departures')}
          {this.renderCollection('variants')}
          {this.renderCollection('scenes')}
        </div>
        <div style={{ marginBottom: '0.5em' }}>
          <h4>By Role</h4>
          {this.renderCollection('appearances')}
          {this.renderCollection('relays')}
        </div>
        <div style={{ marginBottom: '0.5em' }}>
          <h4>Content</h4>
          {this.renderCollection('layouts')}
          {this.renderCollection('content_pages')}
          {this.renderCollection('audio')}
        </div>
        <div style={{ marginBottom: '0.5em' }}>
          <h4>Locations</h4>
          {this.renderCollection('waypoints')}
          {this.renderCollection('geofences')}
          {this.renderCollection('routes')}
        </div>
        <div style={{ marginBottom: '0.5em' }}>
          <h4>By Scene</h4>
          {this.renderSceneSelector()}
          {this.renderCollection('pages')}
          {this.renderCollection('triggers')}
          {this.renderCollection('messages')}
          {this.renderCollection('cues')}
          {this.renderCollection('achievements')}
          {this.renderCollection('times')}
        </div>
      </div>
    );
  }

  render() {
    if (!this.props.script || !this.props.experience) {
      return <div className="container-fluid">Loading!</div>;
    }
    const script = this.props.script;
    const experience = this.props.experience;
    const orgName = this.props.params.orgName;
    // Get current scene from either the resource (if we're looking at one)
    // or the scene name (if we're just browsing the collection from a link).
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12">
            <Link to={`/${orgName}/design`}>Experiences</Link>
            &nbsp;&rsaquo;&nbsp;
            <Link to={`/${orgName}/design/experience/${experience.name}`}>
              {experience.title}
            </Link>
            &nbsp;&rsaquo;&nbsp;
            <Link to={`/${orgName}/design/script/${script.id}`}>
              Revision {script.revision}
            </Link>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-sm-2">
            {this.renderCollections()}
          </div>
          <div className="col-sm-10">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

Script.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  script: PropTypes.object,
  experience: PropTypes.object,
  params: PropTypes.object.isRequired
};

Script.defaultProps = {
  script: null,
  experience: null
};
