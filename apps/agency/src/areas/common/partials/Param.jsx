import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export function renderLink(scriptId, collectionName, resourceName) {
  return (
    <Link
      activeClassName="bold"
      to={
        `/agency/scripts/version/${scriptId}` +
        `/collection/${collectionName}` +
        `/resource/${resourceName}`
      }>
      {resourceName}
    </Link>
  );
}

export default function Param({ scriptId, spec, value }) {
  if (spec.type === 'reference') {
    return renderLink(scriptId, spec.collection, value);
  }
  return value;
}

Param.propTypes = {
  scriptId: PropTypes.number.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired
};
