import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function ScriptsIndex({ children, scripts }) {
  const scriptItems = scripts.map(script => (
    <div key={script.id}>
      <Link
        to={`/agency/scripts/scriptset/${script.name}`}>
        {script.title}
      </Link>
      &nbsp;&bull;&nbsp;
      <Link
        to={`/agency/scripts/script/${script.id}`}>
        v{script.version}
      </Link>
      &nbsp;&bull;&nbsp;
      <Link
        to={`/agency/scripts/scriptset/${script.name}/relays`}>
        Relays
      </Link>
    </div>
  ));
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/agency/scripts">Scripts</Link>
        </div>
      </div>
      <hr />
      {scriptItems}
    </div>
  );
}

ScriptsIndex.propTypes = {
  children: PropTypes.node.isRequired,
  scripts: PropTypes.array.isRequired
};
