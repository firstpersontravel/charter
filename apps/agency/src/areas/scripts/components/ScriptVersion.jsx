import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link, browserHistory } from 'react-router';

import { TextCore } from 'fptcore';

import { getItems, doesCollectionHaveScene } from './utils';

function renderCollection(script, currentCollectionName, collectionName, currentSceneName) {
  // Filter items by scene name
  let items = getItems(script, collectionName);
  if (doesCollectionHaveScene(collectionName)) {
    items = items.filter(item => item.scene === currentSceneName);
  }

  const numItems = items.length;
  if (numItems === 0) {
    return (
      <div key={collectionName}>
        {TextCore.titleForKey(collectionName)}
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
            `/agency/scripts/version/${script.id}/collection/${collectionName}`
          ),
          query: currentSceneName ? { scene: currentSceneName } : null
        }}>
        {TextCore.titleForKey(collectionName)} ({numItems})
      </Link>
    </div>
  );
}

function handleSelectScene(script, sceneName) {
  browserHistory.push(
    `/agency/scripts/version/${script.id}` +
    `${sceneName ? `?scene=${sceneName}` : ''}`
  );
}

function renderSceneSelector(script, currentSceneName) {
  const scenes = script.content.scenes || [];
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
          onChange={e => handleSelectScene(script, e.target.value)}
          value={currentSceneName}>
          <option value="">--</option>
          {sceneOptions}
        </select>
      </div>
    </div>
  );
}

function renderCollections(script, currentCollectionName, currentSceneName) {
  // Don't show directions
  return (
    <div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Core</h4>
        {renderCollection(script, currentCollectionName, 'roles')}
        {renderCollection(script, currentCollectionName, 'departures')}
        {renderCollection(script, currentCollectionName, 'variants')}
        {renderCollection(script, currentCollectionName, 'variant_groups')}
        {renderCollection(script, currentCollectionName, 'scenes')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>By Role</h4>
        {renderCollection(script, currentCollectionName, 'appearances')}
        {renderCollection(script, currentCollectionName, 'relays')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Content</h4>
        {renderCollection(script, currentCollectionName, 'layouts')}
        {renderCollection(script, currentCollectionName, 'content_pages')}
        {renderCollection(script, currentCollectionName, 'audio')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Locations</h4>
        {renderCollection(script, currentCollectionName, 'waypoints')}
        {renderCollection(script, currentCollectionName, 'geofences')}
        {renderCollection(script, currentCollectionName, 'routes')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>By Scene</h4>
        {renderSceneSelector(script, currentCollectionName, currentSceneName)}
        {renderCollection(script, currentCollectionName, 'pages', currentSceneName)}
        {renderCollection(script, currentCollectionName, 'triggers', currentSceneName)}
        {renderCollection(script, currentCollectionName, 'messages', currentSceneName)}
        {renderCollection(script, currentCollectionName, 'cues', currentSceneName)}
        {renderCollection(script, currentCollectionName, 'initiatives', currentSceneName)}
      </div>
    </div>
  );
}

export default function ScriptVersion({ script, children, params, location }) {
  if (!script) {
    return <div className="container-fluid">Loading!</div>;
  }
  // Get current scene from either the resource (if we're looking at one)
  // or the scene name (if we're just browsing the collection from a link).
  let currentSceneName = location.query.scene || '';
  const currentCollectionName = params.collectionName || '';
  if (params.collectionName && params.resourceName) {
    const items = getItems(script, params.collectionName);
    const resource = _.find(items, { name: params.resourceName });
    if (resource) {
      currentSceneName = resource.scene;
    }
  }
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/agency/scripts">Scripts</Link>
          &nbsp;&rsaquo;&nbsp;
          <Link to={`/agency/scripts/script/${script.name}`}>
            {script.title}
          </Link>
          &nbsp;&rsaquo;&nbsp;
          <Link to={`/agency/scripts/version/${script.id}`}>
            v{script.version}
          </Link>
        </div>
      </div>
      <hr />
      <div className="row">
        <div className="col-sm-2">
          {renderCollections(script, currentCollectionName, currentSceneName)}
        </div>
        <div className="col-sm-10">
          {children}
        </div>
      </div>
    </div>
  );
}

ScriptVersion.propTypes = {
  children: PropTypes.node,
  location: PropTypes.object.isRequired,
  script: PropTypes.object,
  params: PropTypes.object
};
