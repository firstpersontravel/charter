import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export function renderLink(organizationName, scriptId, collectionName, resourceName) {
  return (
    <Link
      activeClassName="bold"
      to={
        `/${organizationName}/design/script/${scriptId}` +
        `/collection/${collectionName}` +
        `/resource/${resourceName}`
      }>
      {resourceName}
    </Link>
  );
}

export default function Param({ organizationName, scriptId, spec, value }) {
  if (spec.type === 'reference') {
    return renderLink(organizationName, scriptId, spec.collection, value);
  }
  return value;
}

Param.propTypes = {
  organizationName: PropTypes.string.isRequired,
  scriptId: PropTypes.number.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired
};
