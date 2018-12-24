import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextCore } from 'fptcore';

import { getItems } from './utils';

function renderCollection(script, collectionName) {
  const items = getItems(script, collectionName);
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
        activeClassName="bold"
        to={`/agency/scripts/version/${script.id}/collection/${collectionName}`}>
        {TextCore.titleForKey(collectionName)} ({numItems})
      </Link>
    </div>
  );
}

function renderCollections(script) {
  // Don't show directions
  return (
    <div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Core</h4>
        {renderCollection(script, 'roles')}
        {renderCollection(script, 'departures')}
        {renderCollection(script, 'variants')}
        {renderCollection(script, 'variant_groups')}
        {renderCollection(script, 'scenes')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Content</h4>
        {renderCollection(script, 'layouts')}
        {renderCollection(script, 'content_pages')}
        {renderCollection(script, 'initiatives')}
        {renderCollection(script, 'audio')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>Locations</h4>
        {renderCollection(script, 'waypoints')}
        {renderCollection(script, 'geofences')}
        {renderCollection(script, 'routes')}
      </div>
      <div style={{ marginBottom: '0.5em' }}>
        <h4>By Scene</h4>
        {renderCollection(script, 'pages')}
        {renderCollection(script, 'appearances')}
        {renderCollection(script, 'triggers')}
        {renderCollection(script, 'messages')}
        {renderCollection(script, 'cues')}
      </div>
    </div>
  );
}

export default function ScriptVersion({ script, children }) {
  if (!script) {
    return <div className="container-fluid">Loading!</div>;
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
          {renderCollections(script)}
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
  script: PropTypes.object
};
