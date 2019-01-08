import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export default function DesignIndex({ scripts }) {
  if (scripts.isLoading) {
    return <div className="container-fluid">Loading</div>;
  }
  if (scripts.isError) {
    return <div className="container-fluid">Error</div>;
  }
  const renderedScripts = scripts.map(script => (
    <div key={script.id}>
      <Link to={`/${script.org.name}/${script.experience.name}/design/script/${script.id}`}>
        Revision {script.revision}
      </Link>
    </div>
  ));
  return (
    <div className="container-fluid">
      {renderedScripts}
    </div>
  );
}

DesignIndex.propTypes = {
  scripts: PropTypes.array.isRequired
};
