import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export function renderLink(script, collectionName, resourceName) {
  return (
    <Link
      activeClassName="bold"
      to={
        `/${script.org.name}/${script.experience.name}` +
        `/design/script/${script.id}` +
        `/collection/${collectionName}` +
        `/resource/${resourceName}`
      }>
      {resourceName}
    </Link>
  );
}

export default function Param({ script, spec, value }) {
  if (spec.type === 'reference') {
    return renderLink(script, spec.collection, value);
  }
  return value;
}

Param.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired
};
