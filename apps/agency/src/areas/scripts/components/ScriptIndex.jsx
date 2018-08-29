import React from 'react';
import PropTypes from 'prop-types';

export default function ScriptIndex({ script }) {
  if (!script) {
    return <div>Loading!</div>;
  }
  return (
    <div className="row">
      <div className="col-sm-6">
        resources
      </div>
      <div className="col-sm-6">
        resource
      </div>
    </div>
  );
}

ScriptIndex.propTypes = {
  script: PropTypes.object
};

ScriptIndex.defaultProps = {
  script: null
};
