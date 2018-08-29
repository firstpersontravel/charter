import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function ScriptSet({ scriptName, scripts, children }) {
  const script = scripts[0];
  const scriptTitle = script ? script.title : scriptName;
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-sm-12">
          <Link to="/agency/scripts">Scripts</Link>
          &nbsp;&rsaquo;&nbsp;
          <Link to={`/agency/scripts/scriptset/${scriptName}`}>
            {scriptTitle}
          </Link>
        </div>
      </div>
      <hr />
      {children}
    </div>
  );
}

ScriptSet.propTypes = {
  scriptName: PropTypes.string.isRequired,
  scripts: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired
};
