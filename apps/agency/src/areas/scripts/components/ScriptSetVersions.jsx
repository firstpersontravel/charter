import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function ScriptSetVersions({ scriptName, scripts }) {
  if (!scripts.length) {
    return <div>Loading!</div>;
  }
  const renderedScripts = scripts.map(script => (
    <div key={script.id}>
      <Link
        to={
          `/agency/scripts/version/${script.id}`
        }>
        {script.name} v{script.version}
      </Link>
    </div>
  ));
  return (
    <div className="row">
      <div className="col-sm-6">
        {renderedScripts}
      </div>
      <div className="col-sm-6">
        <Link to={`/agency/scripts/script/${scriptName}/relays`}>
          Relays
        </Link>
      </div>
    </div>
  );
}

ScriptSetVersions.propTypes = {
  scriptName: PropTypes.string.isRequired,
  scripts: PropTypes.array.isRequired
};