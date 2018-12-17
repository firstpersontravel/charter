import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextCore, ScriptCore } from 'fptcore';

function renderCollection(script, collectionName) {
  return (
    <div key={collectionName}>
      <Link
        activeClassName="bold"
        to={`/agency/scripts/version/${script.id}/collection/${collectionName}`}>
        {TextCore.titleForKey(collectionName)}
      </Link>
    </div>
  );
}

const COLLECTION_EXCLUSIONS = ['directions'];

function renderCollections(script) {
  const collectionNames = Object.keys(script.content)
    .filter(key => (
      _.isArray(script.content[key]) &&
      !_.includes(COLLECTION_EXCLUSIONS, key)
    ))
    .concat(ScriptCore.IMPLICIT_COLLECTION_NAMES)
    .sort();
  return collectionNames.map(collectionName => (
    renderCollection(script, collectionName)
  ));
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
          <h3>Collections</h3>
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
