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
    browserHistory.push(
      `/${this.props.script.org.name}/${this.props.script.experience.name}/design/script/${this.props.script.id}` +
      `${sceneName ? `?scene=${sceneName}` : ''}`
    );
  }

  renderCollection(collectionName) {
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
              `/${this.props.script.org.name}/${this.props.script.experience.name}/design/script/${script.id}/collection/${collectionName}`
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
        {this.renderCollection('roles')}
        {this.renderCollection('departures')}
        {this.renderCollection('variants')}
        {this.renderCollection('scenes')}
        {this.renderCollection('appearances')}
        {this.renderCollection('relays')}
        {this.renderCollection('layouts')}
        {this.renderCollection('content_pages')}
        {this.renderCollection('audio')}
        {this.renderCollection('waypoints')}
        {this.renderCollection('geofences')}
        {this.renderCollection('routes')}
        {this.renderSceneSelector()}
        {this.renderCollection('pages')}
        {this.renderCollection('triggers')}
        {this.renderCollection('messages')}
        {this.renderCollection('cues')}
        {this.renderCollection('achievements')}
        {this.renderCollection('times')}
        {this.renderCollection('checkpoints')}
      </div>
    );
  }

  renderNav() {
    const script = this.props.script;
    const sceneLinks = _.map(script.content.scenes, scene => (
      <Link
        key={scene.name}
        className="dropdown-item"
        to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/scene/${scene.name}`}>
        {scene.title}
      </Link>
    ));

    const sections = [
      ['roles', 'Roles', ['roles', 'appearances', 'relays']],
      ['locations', 'Locations', ['waypoints', 'geofences', 'routes']],
      ['variants', 'Variants', ['departures', 'variants']],
      ['media', 'Media', ['layouts', 'content_pages', 'audio']]
    ];

    const sectionLinks = sections.map(section => (
      <li key={section[0]} className="nav-item">
        <Link
          className="nav-link"
          activeClassName="active"
          to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/section/${section[0]}`}>
          {section[1]}
        </Link>
      </li>
    ));

    return (
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <Link
            className="nav-link"
            activeClassName="active"
            to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}`}>
            All
          </Link>
        </li>
        {sectionLinks}
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            activeClassName="active"
            data-toggle="dropdown"
            to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}/scene`}>
            Scenes
          </Link>
          <div className="dropdown-menu">
            {sceneLinks}
          </div>
        </li>
      </ul>
    );
  }

  renderOpts() {
    return (
      <div className="float-right">
        Revision {this.props.script.revision}
      </div>
    );
  }

  render() {
    if (this.props.script.isLoading) {
      return <div className="container-fluid">Loading</div>;
    }
    if (this.props.script.isError) {
      return <div className="container-fluid">Error</div>;
    }
    if (this.props.script.isNull) {
      return <div className="container-fluid">Script not found.</div>;
    }
    return (
      <div className="container-fluid">
        {this.renderOpts()}
        {this.renderNav()}
        <div className="row row-eq-height script-editor-container">
          <div className="script-editor-col col-2">
            {this.renderCollections()}
          </div>
          {this.props.children}
        </div>
      </div>
    );
  }
}

Script.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
